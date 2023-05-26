import {NextResponse} from 'next/server';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {id: string};
  },
): Promise<NextResponse> {
  try {
    const response = await fetch(
      `https://sync.api.cloudconvert.com/v2/jobs/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CLOUDCONVERT_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status !== 200) {
      return NextResponse.json(
        {error: 'Failed to retrieve PNG image'},
        {status: 400},
      );
    }

    const pngData = await response.json();

    return NextResponse.json(pngData);
  } catch (error) {
    console.error('Failed to retrieve PNG image:', error);
    return NextResponse.json(
      {error: 'Failed to retrieve PNG image'},
      {status: 500},
    );
  }
}
