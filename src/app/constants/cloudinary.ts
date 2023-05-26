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
    throw new Error('Failed to upload image to Cloudinary.');
  }

  const data = await response.json();
  const url = data.url;
  const bytes = data.bytes;

  return {url, bytes};
};
