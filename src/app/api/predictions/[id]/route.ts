import {NextResponse} from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN as string,
});

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {id: string};
  },
): Promise<NextResponse> {
  try {
    const prediction = await replicate.predictions.get(params.id);

    if (prediction?.error) {
      return NextResponse.json({error: 'Prediction failed'}, {status: 500});
    }

    const {status, error, id, output} = prediction;

    return NextResponse.json({status, error, id, output});
  } catch (error) {
    console.error('Failed to retrieve prediction:', error);
    return NextResponse.json(
      {error: 'Failed to retrieve prediction'},
      {status: 500},
    );
  }
}
