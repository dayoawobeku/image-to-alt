export interface Prediction {
  status: string;
  output: string;
  id: string;
}

export interface Task {
    name: string;
    result: {
      files: {url: string}[];
    };
  }