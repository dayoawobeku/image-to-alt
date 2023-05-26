export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_ID}/image/upload`;
export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_UPLOAD_PRESET;

export const uploadImageToCloudinary = async (base64Image: string) => {
  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64Image,
      upload_preset: UPLOAD_PRESET,
    }),
  });

  if (!response.ok) {
    const {error} = await response.json();
    throw new Error(error.message);
  }

  const {url, bytes} = await response.json();

  return {url, bytes};
};
