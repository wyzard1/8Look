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
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/authenticate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: response.status });
    }

    const data = await response.json().catch(() => ({ ok: true }));
    const nextResponse = NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    const cookie = response.headers.get('set-cookie');
    if (cookie) {
      nextResponse.headers.set('set-cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Log in proxy failed:', error);
    return NextResponse.json({ error: 'Log in service unavailable.' }, { status: 502 });
  }
}
