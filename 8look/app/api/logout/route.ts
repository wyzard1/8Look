import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );

  response.cookies.delete('authToken');

  return response;
}
