import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getBearerToken } from '@/lib/api';

type RouteContext = {
  params: Promise<{ recipientId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { recipientId } = await context.params;
  const recipientUserId = Number(recipientId);

  if (!Number.isInteger(recipientUserId) || recipientUserId < 1) {
    return NextResponse.json({ error: 'Invalid recipient.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = getBearerToken(request, cookieStore.get('authToken')?.value);

  if (!token) {
    return NextResponse.json({ error: 'You must be logged in to view messages.' }, { status: 401 });
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/messages/${recipientUserId}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to load messages.' }, { status: response.status });
    }

    const messages: unknown = await response.json();
    return NextResponse.json(Array.isArray(messages) ? messages : [], {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Message service unavailable.' }, { status: 502 });
  }
}
