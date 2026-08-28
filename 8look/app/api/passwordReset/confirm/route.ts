import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';

const tokenPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!tokenPattern.test(token)) {
      return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/passwordReset/confirm`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = typeof data?.message === 'string'
        ? data.message
        : response.status === 409
          ? 'Reset link is invalid, expired, or has already been used.'
          : 'Password could not be reset.';

      return NextResponse.json({ error: message, status: data?.status }, { status: response.status });
    }

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch (error) {
    console.error('Password reset confirm proxy failed:', error);
    return NextResponse.json({ error: 'Password reset service unavailable.' }, { status: 502 });
  }
}
