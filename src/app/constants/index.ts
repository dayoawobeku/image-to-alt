import {
  getPrediction,
  sendPNGForPrediction,
  convertAndPredict,
  sleep,
} from './prediction';
import {MAX_FILE_SIZE_BYTES} from './image-size';
import {
  CLOUDINARY_UPLOAD_URL,
  UPLOAD_PRESET,
  uploadImageToCloudinary,
} from './cloudinary';
import {convertToCSV} from './csv'

export {
  CLOUDINARY_UPLOAD_URL,
  UPLOAD_PRESET,
  uploadImageToCloudinary,
  getPrediction,
  MAX_FILE_SIZE_BYTES,
  sendPNGForPrediction,
  convertAndPredict,
  sleep,
  convertToCSV
};
