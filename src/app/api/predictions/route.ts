import {NextResponse} from 'next/server';
import {Prediction} from 'replicate';
import {MAX_FILE_SIZE_BYTES} from '@/app/constants';

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

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Pinned to a specific version of Stable Diffusion
      // See https://replicate.com/stability-ai/stable-diffussion/versions
      version:
        '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',

      input: {
        model: 'blip',
        use_beam_search: true,
        image,
        task: 'image_captioning',
      },
    }),
  });

  if (response.status !== 201) {
    return NextResponse.json(
      {error: 'Failed to create prediction'},
      {status: 500},
    );
  }

  const prediction: Prediction = await response.json();
  return NextResponse.json(prediction);
}
