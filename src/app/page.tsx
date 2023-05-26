'use client';

import {ChangeEvent, useState} from 'react';
import Image from 'next/image';
import {Prediction} from 'replicate';
import {v4 as uuidv4} from 'uuid';
import {
  MAX_FILE_SIZE_BYTES,
  convertAndPredict,
  sendPNGForPrediction,
  uploadImageToCloudinary,
} from './constants';
import {ExtendedPrediction} from './types';

export default function Home() {
  const [imageData, setImageData] = useState<
    {id: string; url: string; size: number}[]
  >([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState('');
  const [conversions, setConversions] = useState<ExtendedPrediction[]>([]);

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

      // Step 1: Upload image to Cloudinary
      const imageProperties = await uploadImageToCloudinary(base64Image);
      const {url, bytes} = imageProperties;
      const imageId = uuidv4();
      setImageData(prevImageData => [
        ...prevImageData,
        {id: imageId, url, size: bytes},
      ]);

      // Step 2: Initiate conversion and prediction with the Cloudinary image URL
      const result = await sendPNGForPrediction(url);

      // Set the prediction state
      const extendedResult = {
        ...result,
        imageId,
        image: imageProperties.url,
        imageSize: imageProperties.bytes,
      };

      // Update the conversions array
      setConversions(prevConversions => [...prevConversions, extendedResult]);

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

        try {
          // Upload SVG image to Cloudinary
          const imageProperties = await uploadImageToCloudinary(
            svgDataUrl as string,
          );
          const {url, bytes} = imageProperties;
          const imageId = uuidv4();

          setImageData(prevImageData => [
            ...prevImageData,
            {id: imageId, url, size: bytes},
          ]);

          await convertAndPredict(
            url,
            setPrediction,
            setConversions,
            imageProperties,
            imageId,
          );
        } catch (error) {
          console.error('Image upload to Cloudinary failed:', error);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  console.log(conversions, 'saio');
  console.log(imageData, 'imggg');

  return (
    <>
      <form className="px-6 py-10">
        <h1>Upload image below</h1>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleUpload}
        />
        {error ? <div>{error}</div> : null}
        <p>SVG</p>
        <input type="file" accept="image/svg+xml" onChange={handleFileChange} />
      </form>

      {imageData.map(({id, url, size}) => {
        const conversion = conversions.find(conv => conv.imageId === id);
        return (
          <div key={id}>
            <Image alt="Uploaded image" src={url} width={56} height={56} />
            <p>Size: {Math.round(size / 1000)} kb</p>
            {conversion && conversion.status === 'succeeded' ? (
              <p>
                {conversion.output.startsWith('Caption: ')
                  ? conversion.output.substring(9)
                  : conversion.output}
              </p>
            ) : (
              'loading...'
            )}
          </div>
        );
      })}
    </>
  );
}
