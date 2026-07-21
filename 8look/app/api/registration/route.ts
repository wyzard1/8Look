import { NextRequest, NextResponse } from 'next/server';

function getApiBaseUrl() {
  const configuredUrl = process.env.SPRING_API_URL ?? process.env.API_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const host = process.env.API_HOST ?? 'localhost';
  const port = process.env.API_PORT ?? '8080';
  return `http://${host}:${port}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !email || !phoneNumber || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/registration`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const error =
        response.status === 409
          ? 'An account with that email or username already exists.'
          : 'Registration failed.';

      return NextResponse.json({ error }, { status: response.status });
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch (error) {
    console.error('Registration proxy failed:', error);
    return NextResponse.json({ error: 'Registration service unavailable.' }, { status: 502 });
  }
}
