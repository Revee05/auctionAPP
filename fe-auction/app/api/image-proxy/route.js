import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) return new NextResponse('Missing url parameter', { status: 400 });

    const upstream = await fetch(url);
    if (!upstream.ok) return new NextResponse('Upstream fetch failed', { status: upstream.status });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstream.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
