import { NextRequest, NextResponse } from 'next/server';

const searchPattern = /^[a-zA-Z0-9 -]{3,20}$/;

type ApiListing = {
  id?: unknown;
  categoryId?: unknown;
  title?: unknown;
  price?: unknown;
  place?: unknown;
  images?: unknown;
};

function toPublicListing(value: unknown) {
  const listing = value as ApiListing;
  return {
    id: typeof listing.id === 'number' ? listing.id : 0,
    categoryId: typeof listing.categoryId === 'number' ? listing.categoryId : null,
    title: typeof listing.title === 'string' ? listing.title : '',
    price: typeof listing.price === 'number' ? listing.price : null,
    place: typeof listing.place === 'string' ? listing.place : null,
    images: Array.isArray(listing.images)
      ? listing.images.filter((image): image is string => typeof image === 'string')
      : [],
  };
}

function getApiBaseUrl() {
  const configuredUrl = process.env.SPRING_API_URL ?? process.env.API_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const host = process.env.API_HOST ?? 'localhost';
  const port = process.env.API_PORT ?? '8080';
  return `http://${host}:${port}`;
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
