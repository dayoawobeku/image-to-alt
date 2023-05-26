import {NextResponse} from 'next/server';
import Replicate from 'replicate';
import {MAX_FILE_SIZE_BYTES} from '@/app/constants';

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN as string,
});

interface PredictionRequest {
  image: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!req.body) {
    return NextResponse.json(
      {
        success: false,
        alt: '',
        message: 'No image data',
      },
      {
        status: 400,
      },
    );
  }

  const body: PredictionRequest = await req.json();
  const {image} = body;

  // Validate file size
  const fileSize = (image.length * 3) / 4; // Estimate base64 file size (assuming no padding)
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        alt: '',
        message: 'File size exceeds the maximum allowed limit.',
      },
      {
        status: 400,
      },
    );
  }

  const prediction = await replicate.predictions.create({
    version: '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',

    input: {
      model: 'blip',
      use_beam_search: true,
      image,
      task: 'image_captioning',
    },
  });

  if (prediction?.error) {
    console.error('Prediction error:', prediction.error);
    return NextResponse.json({error: 'Prediction failed'}, {status: 500});
  }

  return NextResponse.json(prediction);
}
