export type PublicListing = {
  id: number;
  categoryId?: number | null;
  title: string;
  price?: number | null;
  place?: string | null;
  updatedAt?: string | null;
  images?: string[] | null;
};

export type ApiListing = {
  id?: unknown;
  categoryId?: unknown;
  title?: unknown;
  description?: unknown;
  price?: unknown;
  place?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  images?: unknown;
  sellerId?: unknown;
  viewCount?: unknown;
  seller?: unknown;
};

export type ListingDetails = {
  id: number;
  title: string;
  description: string;
  price: number;
  place: string;
  createdAt: string | null;
  updatedAt: string | null;
  categoryId: number;
  images: string[];
  sellerId: number;
  viewCount: number;
  seller?: {
    id: number;
    username: string;
    avatarUrl: string | null;
    lastLogin: string | null;
    phoneNumber?: string | null;
  } | null;
};

export const fallbackListingImage = '/listing-placeholder.png';

export function safeListingImageUrl(image?: string | null) {
  if (!image) return fallbackListingImage;

  try {
    const url = new URL(image);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : fallbackListingImage;
  } catch {
    return fallbackListingImage;
  }
}

export function safeFirstListingImageUrl(images?: string[] | null) {
  return safeListingImageUrl(images?.[0]);
}

export function toPublicListing(value: unknown): PublicListing {
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
