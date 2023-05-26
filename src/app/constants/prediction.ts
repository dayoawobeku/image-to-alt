import {SetStateAction} from 'react';
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

  if (!response.ok) {
    const {detail} = await response.json();
    throw new Error(detail);
  }

  let prediction: ExtendedPrediction = await response.json();
  const maxRetries = 5;
  const retryDelay = 1000;
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
  setConversions: (value: SetStateAction<ExtendedPrediction[]>) => void,
  imageProperties: ImageProperties,
  imageId: string,
): Promise<void> => {
  try {
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

    const response2 = await fetch(`/api/convert-svg-to-png/${data?.taskId}`);
    const data2 = await response2.json();
    const pngUrl = data2.data.tasks.find(
      (task: Task) => task.name === 'export_png',
    ).result.files[0].url;

    const result = await sendPNGForPrediction(pngUrl);

    const extendedResult = {
      ...result,
      imageId,
      image: imageProperties.url,
      imageSize: imageProperties.bytes,
    };

    setConversions(prevConversions => [...prevConversions, extendedResult]);
  } catch (error) {
    console.error('Conversion and prediction request failed:', error);
  }
};

export {getPrediction, sendPNGForPrediction, convertAndPredict, sleep};
