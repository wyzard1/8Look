import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';
import { toPublicListing } from '@/lib/listings';

type ApiSeller = {
  id?: unknown;
  username?: unknown;
  avatarUrl?: unknown;
  lastLogin?: unknown;
  phoneNumber?: unknown;
};

type ApiUserListings = {
  seller?: ApiSeller | null;
  listings?: unknown;
};

function toPublicSeller(value: unknown) {
  const seller = value as ApiSeller;
  return {
    id: typeof seller.id === 'number' ? seller.id : 0,
    username: typeof seller.username === 'string' ? seller.username : 'Unknown seller',
    avatarUrl: typeof seller.avatarUrl === 'string' ? seller.avatarUrl : null,
    lastLogin: typeof seller.lastLogin === 'string' ? seller.lastLogin : null,
    phoneNumber: typeof seller.phoneNumber === 'string' ? seller.phoneNumber : null,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid seller id.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/listings/user/${id}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const error = typeof payload?.error === 'string'
        ? payload.error
        : `Listing service returned ${response.status}.`;
      return NextResponse.json({ error }, { status: response.status });
    }

    const data: ApiUserListings = await response.json();
    const listings = Array.isArray(data.listings) ? data.listings.map(toPublicListing) : [];

    return NextResponse.json(
      { seller: toPublicSeller(data.seller), listings },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch {
    return NextResponse.json({ error: 'Listing service unavailable.' }, { status: 502 });
  }
}
