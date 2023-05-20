import axios from 'axios';

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_ID}/image/upload`;

export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_UPLOAD_PRESET;

export const uploadImageToCloudinary = async (base64Image: string) => {
  const cloudinaryResponse = await axios.post(CLOUDINARY_UPLOAD_URL, {
    file: base64Image,
    upload_preset: UPLOAD_PRESET,
  });
  return cloudinaryResponse.data.url;
};
