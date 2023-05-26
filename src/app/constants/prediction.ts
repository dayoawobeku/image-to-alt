import {SetStateAction} from 'react';
import {Prediction} from 'replicate';
import {ExtendedPrediction, ImageProperties, Task} from '../types';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const getPrediction = async (id: string): Promise<ExtendedPrediction> => {
  const response = await fetch(`/api/predictions/${id}`);
  const data = await response.json();
  return data;
};

const sendPNGForPrediction = async (
  pngUrl: string,
): Promise<ExtendedPrediction> => {
  const response = await fetch('/api/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: pngUrl,
    }),
  });

  if (response.status !== 200) {
    const {detail} = await response.json();
    throw new Error(detail);
  }

  let prediction: Prediction = await response.json();
  const maxRetries = 5; // Maximum number of retries
  const retryDelay = 1000; // Delay between retries in milliseconds
  let retryCount = 0;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    retryCount < maxRetries
  ) {
    await sleep(retryDelay);
    prediction = await getPrediction(prediction.id);
    retryCount++;
  }

  if (prediction.status !== 'succeeded') {
    throw new Error('Prediction process took too long to complete.');
  }

  return prediction;
};

const convertAndPredict = async (
  imageUrl: string,
  setPrediction: (value: SetStateAction<ExtendedPrediction | null>) => void,
  setConversions: (value: SetStateAction<ExtendedPrediction[]>) => void,
  imageProperties: ImageProperties,
  imageId: string,
): Promise<void> => {
  try {
    // Step 1: Initiate conversion from SVG to PNG
    const response = await fetch('/api/convert-svg-to-png', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl,
      }),
    });

    const data = await response.json();

    if (response.status !== 200) {
      console.error('Conversion request failed:', data);
      return;
    }

    // Step 2: Retrieve the converted PNG image
    const response2 = await fetch(`/api/convert-svg-to-png/${data?.taskId}`);
    const data2 = await response2.json();
    const pngUrl = data2.data.tasks.find(
      (task: Task) => task.name === 'export_png',
    ).result.files[0].url;

    const result = await sendPNGForPrediction(pngUrl);

    // Set the prediction state
    const extendedResult = {
      ...result,
      imageId,
      image: imageProperties.url,
      imageSize: imageProperties.bytes,
    };

    // Update the conversions array
    setConversions(prevConversions => [...prevConversions, extendedResult]);

    setPrediction(result);
  } catch (error) {
    console.error('Conversion and prediction request failed:', error);
  }
};

export {getPrediction, sendPNGForPrediction, convertAndPredict, sleep};
