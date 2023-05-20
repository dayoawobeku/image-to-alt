'use client';

import {ChangeEvent, useState} from 'react';
import Image from 'next/image';
import {Prediction} from 'replicate';
import {
  MAX_FILE_SIZE_BYTES,
  convertAndPredict,
  sendPNGForPrediction,
  uploadImageToCloudinary,
} from './constants';

export default function Home() {
  const [image, setImage] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState('');
  const [svgDataUrl, setSvgDataUrl] = useState('');

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('File size exceeds the maximum allowed limit.');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      setImage(base64Image);

      // Step 1: Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(base64Image);

      // Step 2: Initiate conversion and prediction with the Cloudinary image URL
      const result = await sendPNGForPrediction(imageUrl);

      // Set the prediction state
      setPrediction(result);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds the maximum allowed limit.');
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();

      reader.onload = async e => {
        const svgDataUrl = e.target?.result;
        setSvgDataUrl(svgDataUrl as string);

        try {
          // Upload SVG image to Cloudinary
          const cloudinaryUrl = await uploadImageToCloudinary(
            svgDataUrl as string,
          );

          await convertAndPredict(cloudinaryUrl, setPrediction);
        } catch (error) {
          console.error('Image upload to Cloudinary failed:', error);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <form className="px-6 py-10">
      <h1>Upload image below</h1>
      <input
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleUpload}
      />
      {image ? (
        <div className="mt-10">
          <Image alt="image" src={image} width={300} height={300} />
        </div>
      ):null}
      {error ? <div>{error}</div> : null}
      {prediction && prediction.status === 'succeeded' ? (
        <div className="mt-10">
          <h2>Result</h2>
          <div className="mt-4">
            <div>{prediction.output}</div>
          </div>
        </div>
      ):null}

      <p>SVG</p>
      <input type="file" accept="image/svg+xml" onChange={handleFileChange} />
      {svgDataUrl ? (
        <div className="mt-10">
          <Image alt="image" src={svgDataUrl} width={300} height={300} />
        </div>
      ): null}
    </form>
  );
}
