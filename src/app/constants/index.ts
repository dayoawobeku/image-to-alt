import {getPrediction} from './prediction';
import {MAX_FILE_SIZE_BYTES} from './image-size';
import {
  CLOUDINARY_UPLOAD_URL,
  UPLOAD_PRESET,
  uploadImageToCloudinary,
} from './cloudinary';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export {
  sleep,
  CLOUDINARY_UPLOAD_URL,
  UPLOAD_PRESET,
  uploadImageToCloudinary,
  getPrediction,
  MAX_FILE_SIZE_BYTES,
};
