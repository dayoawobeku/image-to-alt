import axios from 'axios';
import {Prediction} from 'replicate';
import {Task} from '../types';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const getPrediction = async (id: string): Promise<Prediction> => {
  const response = await axios.get(`/api/predictions/${id}`);
  return response.data;
};

const sendPNGForPrediction = async (pngUrl: string): Promise<Prediction> => {
  const response = await axios.post('/api/predictions', {
    image: pngUrl,
  });

  if (response.status !== 200) {
    const {detail} = response.data;
    throw new Error(detail);
  }

  let prediction: Prediction = response.data;

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    await sleep(1000);
    prediction = await getPrediction(prediction.id);
  }

  return prediction;
};

const convertAndPredict = async (
  imageUrl: string,
  setPrediction: (result: Prediction | null) => void,
): Promise<void> => {
  try {
    // Step 1: Initiate conversion from SVG to PNG
    const response = await axios.post('/api/convert-svg-to-png', {
      url: imageUrl,
    });

    const data = response.data;

    if (response.status !== 200) {
      console.error('Conversion request failed:', data);
      return;
    }

    // Step 2: Retrieve the converted PNG image
    const response2 = await axios.get(
      `/api/convert-svg-to-png/${data?.taskId}`,
    );
    const data2 = response2.data;
    const pngUrl = data2.data.tasks.find(
      (task: Task) => task.name === 'export_png',
    ).result.files[0].url;

    const result = await sendPNGForPrediction(pngUrl);

    // Set the prediction state
    setPrediction(result);
  } catch (error) {
    console.error('Conversion and prediction request failed:', error);
  }
};

export {getPrediction, sendPNGForPrediction, convertAndPredict, sleep};
