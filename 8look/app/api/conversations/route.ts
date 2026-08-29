import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getBearerToken } from '@/lib/api';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = getBearerToken(request, cookieStore.get('authToken')?.value);

  if (!token) {
    return NextResponse.json({ error: 'You must be logged in to view conversations.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/conversations`, {
      cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to load conversations.' }, { status: response.status });
    }

    const conversations: unknown = await response.json();
    return NextResponse.json(Array.isArray(conversations) ? conversations : [], {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Conversation service unavailable.' }, { status: 502 });
  }
}
