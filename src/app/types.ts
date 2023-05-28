import {Prediction} from 'replicate';

export interface ExtendedPrediction extends Prediction {
  image?: string;
  imageSize?: number;
  imageId?: string;
  fileName?: string;
}

export interface PredictionInput {
  image: string;
  model: string;
  task: string;
  use_beam_search: boolean;
}

export interface Task {
  name: string;
  result: {
    files: {url: string}[];
  };
}

export interface ImageProperties {
  url: string;
  bytes: number;
}
