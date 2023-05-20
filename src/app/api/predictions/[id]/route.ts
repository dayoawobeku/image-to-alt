import {NextResponse} from 'next/server';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {id: string};
  },
) {
  const response = await fetch(
    'https://api.replicate.com/v1/predictions/' + params.id,
    {
      headers: {
        Authorization: `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status !== 200) {
    return NextResponse.json(
      {error: 'Failed to retrieve prediction'},
      {status: 400},
    );
  }

  const prediction = await response.json();
  return NextResponse.json(prediction);
}
