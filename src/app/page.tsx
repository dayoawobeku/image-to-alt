'use client';

import {ChangeEvent, useState} from 'react';
import Image from 'next/image';
import axios from 'axios';
import {Prediction} from 'replicate';
import {
  MAX_FILE_SIZE_BYTES,
  getPrediction,
  sleep,
  uploadImageToCloudinary,
} from './constants';

// Make an HTTP request to initiate SVG to PNG conversion
async function convertSVGToPNG(svgUrl: string) {
  try {
    const response = await fetch('/api/convert-svg-to-png', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({url: svgUrl}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Conversion request failed:', data);
      return;
    }

    // Call the dynamic route for retrieving the converted PNG image
    const response2 = await fetch(`/api/convert-svg-to-png/${data?.taskId}`);
    const data2 = await response2.json();
    const pngUrl = data2.data.tasks.find(task => task.name === 'export_png')
      .result.files[0].url;

    const response3 = await axios.post('/api/predictions', {
      image: pngUrl,
    });

    if (response3.status !== 200) {
      const {detail} = response3.data;
      throw new Error(detail);
    }

    let prediction: Prediction = response3.data;
    // setPrediction(prediction);

    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed'
    ) {
      await sleep(1000);
      prediction = await getPrediction(prediction.id);
      // setPrediction(prediction);
    }
  } catch (error) {
    console.error('Conversion request failed:', error);
  }
}

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

      // Step 2: POST request to API endpoint with the Cloudinary image URL
      const response = await axios.post('/api/predictions', {
        image: imageUrl,
      });

      if (response.status !== 200) {
        const {detail} = response.data;
        throw new Error(detail);
      }

      let prediction: Prediction = response.data;
      setPrediction(prediction);

      while (
        prediction.status !== 'succeeded' &&
        prediction.status !== 'failed'
      ) {
        await sleep(1000);
        prediction = await getPrediction(prediction.id);
        setPrediction(prediction);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();

      reader.onload = async e => {
        const svgDataUrl = e.target?.result;

        try {
          // Upload SVG image to Cloudinary
          const cloudinaryUrl = await uploadImageToCloudinary(svgDataUrl);

          // Initiate conversion with the Cloudinary URL
          await convertSVGToPNG(cloudinaryUrl);
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
      ) : null}
      {error ? <div>{error}</div> : null}
      {prediction && prediction.status === 'succeeded' ? (
        <div className="mt-10">
          <h2>Result</h2>
          <div className="mt-4">
            <div>{prediction.output}</div>
          </div>
        </div>
      ) : null}

      <p>SVG</p>
      <input type="file" accept="image/svg+xml" onChange={handleFileChange} />
      {svgDataUrl ? (
        <div className="mt-10">
          <Image alt="image" src={svgDataUrl} width={300} height={300} />
        </div>
      ) : null}
    </form>
  );
}
