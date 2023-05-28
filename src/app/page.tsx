'use client';

import {ChangeEvent, useState} from 'react';
import Image from 'next/image';
import {v4 as uuidv4} from 'uuid';
import {
  MAX_FILE_SIZE_BYTES,
  convertAndPredict,
  convertToCSV,
  sendPNGForPrediction,
  uploadImageToCloudinary,
} from './constants';
import {ExtendedPrediction} from './types';

export default function Home() {
  const [imageData, setImageData] = useState<
    {id: string; url: string; size: number}[]
  >([]);
  const [error, setError] = useState('');
  const [conversions, setConversions] = useState<ExtendedPrediction[]>([]);
  const [csvData, setCSVData] = useState('');

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

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

      const imageProperties = await uploadImageToCloudinary(base64Image);
      const {url, bytes} = imageProperties;
      const imageId = uuidv4();
      setImageData(prevImageData => [
        ...prevImageData,
        {id: imageId, url, size: bytes},
      ]);

      const result = await sendPNGForPrediction(url);

      const extendedResult = {
        ...result,
        imageId,
        image: imageProperties.url,
        imageSize: imageProperties.bytes,
        fileName: file.name,
      };

      setConversions(prevConversions => {
        const updatedConversions = [...prevConversions, extendedResult];
        const csv = convertToCSV(updatedConversions);
        setCSVData(csv);
        return updatedConversions;
      });
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds the maximum allowed limit.');
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();

      reader.onload = async e => {
        const svgDataUrl = e.target?.result;

        try {
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
            setConversions,
            imageProperties,
            imageId,
            file as File,
            setCSVData,
          );
        } catch (error) {
          console.error('Image upload to Cloudinary failed:', error);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <h1 className="text-3xl">Generate alt texts for your images!</h1>
      <form className="mt-8">
        <div>
          <h1>Upload image below</h1>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleUpload}
          />
        </div>
        {error ? <div>{error}</div> : null}
        <div className="mt-2">
          <p>SVG</p>
          <input
            type="file"
            accept="image/svg+xml"
            onChange={handleFileChange}
          />
        </div>
      </form>

      {imageData.map(({id, url, size}) => {
        const conversion = conversions.find(conv => conv.imageId === id);
        return (
          <div className="mt-6" key={id}>
            <Image alt="Uploaded image" src={url} width={48} height={48} />
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

      {csvData ? (
        <>
          <button
            className="mt-8 bg-purple-700 p-2 text-white disabled:bg-transparent disabled:text-gray-500 disabled:outline disabled:outline-1 disabled:outline-gray-500"
            onClick={() => {
              const csvDataEncoded = encodeURIComponent(csvData);
              const link = document.createElement('a');
              link.href = `data:text/csv;charset=utf-8,${csvDataEncoded}`;
              link.download = 'conversions.csv';
              link.click();
            }}
            onKeyDown={event => {
              if (event.keyCode === 13 || event.keyCode === 32) {
                event.preventDefault();
                const csvDataEncoded = encodeURIComponent(csvData);
                const link = document.createElement('a');
                link.href = `data:text/csv;charset=utf-8,${csvDataEncoded}`;
                link.download = 'conversions.csv';
                link.click();
              }
            }}
            aria-label="Download CSV"
            title="Download CSV"
            disabled={conversions.length < 3}
          >
            Download CSV
          </button>
          {conversions.length < 3 ? (
            <p className="mt-2 text-sm">
              Upload up to 3 images to download as CSV
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
}
