import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] || request.nextUrl.hostname;
  const publicApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? `${request.nextUrl.protocol}//${host}:${process.env.API_PORT ?? '8080'}`;

  return NextResponse.json({
    socketUrl: `${publicApiUrl.replace(/\/$/, '')}/ws`,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
