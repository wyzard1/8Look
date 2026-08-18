import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '../registration/route';

const searchPattern = /^[a-zA-Z0-9 -]{3,20}$/;

type ApiListing = {
  id?: unknown;
  categoryId?: unknown;
  title?: unknown;
  price?: unknown;
  place?: unknown;
  updatedAt?: unknown;
  images?: unknown;
};

type ApiUser = {
  id?: unknown;
};

export function getBearerToken(request: NextRequest, cookieToken?: string) {
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return cookieToken;
}

function toPublicListing(value: unknown) {
  const listing = value as ApiListing;
  return {
    id: typeof listing.id === 'number' ? listing.id : 0,
    categoryId: typeof listing.categoryId === 'number' ? listing.categoryId : null,
    title: typeof listing.title === 'string' ? listing.title : '',
    price: typeof listing.price === 'number' ? listing.price : null,
    place: typeof listing.place === 'string' ? listing.place : null,
    updatedAt: typeof listing.updatedAt === 'string' ? listing.updatedAt : null,
    images: Array.isArray(listing.images)
      ? listing.images.filter((image): image is string => typeof image === 'string')
      : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = getBearerToken(request, cookieStore.get('authToken')?.value);

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to create a listing.' }, { status: 401 });
    }

    const apiBaseUrl = getApiBaseUrl();
    const userResponse = await fetch(`${apiBaseUrl}/me`, {
      cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'You must be logged in to create a listing.' }, { status: 401 });
    }

    const user = await userResponse.json().catch(() => null) as ApiUser | null;
    const sellerId = Number(user?.id);

    if (!Number.isInteger(sellerId)) {
      return NextResponse.json({ error: 'Unable to identify the current user.' }, { status: 401 });
    }

    const incomingFormData = await request.formData();
    const title = String(incomingFormData.get('title') ?? '').trim();
    const description = String(incomingFormData.get('description') ?? '').trim();
    const place = String(incomingFormData.get('place') ?? '').trim();
    const categoryId = Number(incomingFormData.get('categoryId'));
    const rawPrice = String(incomingFormData.get('price') ?? '').trim();
    const price = rawPrice ? Number(rawPrice) : null;

    if (!title || !Number.isInteger(categoryId)) {
      return NextResponse.json({ error: 'Title and category are required.' }, { status: 400 });
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append(
      'listing',
      new Blob([
        JSON.stringify({
          sellerId,
          categoryId,
          title,
          description,
          price,
          place,
        }),
      ], { type: 'application/json' }),
    );

    for (const file of incomingFormData.getAll('files')) {
      if (file instanceof File && file.size > 0) {
        formData.append('files', file, file.name);
      }
    }

    const response = await fetch(`${apiBaseUrl}/listings/create`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Listing could not be created.' },
        { status: response.status },
      );
    }

    return NextResponse.json(toPublicListing(data), {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Listing creation proxy failed:', error);
    return NextResponse.json({ error: 'Listing service unavailable.' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  if (query && !searchPattern.test(query)) {
    return NextResponse.json({ error: 'Invalid search query.' }, { status: 400 });
  }

  const apiBaseUrl = getApiBaseUrl();
  const endpoint = query
    ? `${apiBaseUrl}/listings/search?query=${encodeURIComponent(query)}`
    : `${apiBaseUrl}/listings/all`;

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Listing service unavailable.' }, { status: 502 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid listing response.' }, { status: 502 });
    }

    return NextResponse.json(data.map(toPublicListing), {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Listing service unavailable.' }, { status: 502 });
  }
}
