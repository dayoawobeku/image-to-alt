import {NextResponse} from 'next/server';

export async function POST(req: Request): Promise<NextResponse> {
  if (!req.body) {
    return NextResponse.json(
      {
        success: false,
        alt: '',
        message: 'No svg data',
      },
      {
        status: 400,
      },
    );
  }

  const body = await req.json();
  const {url} = body;

  const response = await fetch('https://api.cloudconvert.com/v2/jobs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_CLOUDCONVERT_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        import_svg: {
          operation: 'import/url',
          url,
        },
        convert_svg_to_png: {
          operation: 'convert',
          input: ['import_svg'],
          input_format: 'svg',
          output_format: 'png',
        },
        export_png: {
          operation: 'export/url',
          input: ['convert_svg_to_png'],
        },
      },
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error('SVG to PNG conversion error:', responseData);
    return NextResponse.json({error: 'Conversion failed'}, {status: 500});
  }

  const {id: taskId} = responseData.data;
  return NextResponse.json({taskId});
}
