'use client';

import {
  Clock3,
  MapPin,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import SiteHeader, { defaultAvatarUrl, HeaderSearch } from '../../components/SiteHeader';
import styles from './listing.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ApiListing } from '@/app/api/listing/[id]/route';
import { formatPrice, formatRelativeTime } from '@/lib/format';

const fallbackImage = '/listing-placeholder.png';

export function formatLastLogin(lastLogin?: string | null) {
  if (!lastLogin) return 'Last seen unknown';

  const lastLoginTime = new Date(lastLogin).getTime();
  if (!Number.isFinite(lastLoginTime)) return 'Last seen unknown';

  const secondsAgo = Math.max(0, Math.floor((Date.now() - lastLoginTime) / 1000));

  if (secondsAgo < 60) return 'Last seen just now';

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `Last seen ${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `Last seen ${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `Last seen ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `Last seen ${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;

  const yearsAgo = Math.floor(daysAgo / 365);
  return `Last seen ${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago`;
}

export function safeImageUrl(image?: string | null) 
{
  if (!image) return fallbackImage;

  try 
  {
    const url = new URL(image);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : fallbackImage;
  } catch 
  {
    return fallbackImage;
  }
}

export default function ProductPage() 
{
  const [listing, setListing] = useState<ApiListing | null>(null);
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const imageUrls = useMemo(
    () => listing?.images?.map(safeImageUrl).filter((image) => image !== fallbackImage) ?? [],
    [listing],
  );
  const selectedImage = imageUrls[selectedImageIndex] ?? fallbackImage;

  useEffect(() => {
    if (!id) return;

    async function fetchListing()
    {
      try{
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/listing/${id}`,
              {
                  cache: "no-store"
              });
      
              if(!response.ok) throw new Error("Unable to fetch listing");
      
      const data: ApiListing = await response.json();
      setListing(data);
      setSelectedImageIndex(0);
      }
      catch{
        setListing(null);
        setError("Unable to fetch listing");
      }
      finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id])


  return (
    <main>
      <SiteHeader search={<HeaderSearch />} />

      {loading ? (
      <div>
        <h1>Loading listing...</h1>
      </div>
      ) : error || !listing ?
      (<div>
        <h1>Product not available</h1>
      </div>) :
      (<section className={styles.productPage}>
        <div className={styles.productGallery}>
          <div className={styles.productImageWrap}>
            <img
              src={selectedImage}
              alt=""
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackImage;
              }}
            />
          </div>
          {imageUrls.length > 1 && (
            <div className={styles.productThumbnails} aria-label="Listing photos">
              {imageUrls.map((image, index) => (
                <button
                  className={index === selectedImageIndex ? styles.active : ''}
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>


        <article className={styles.productDetails}>
          <section className={styles.sellerCard} aria-label="Seller information">
            <img
              src={listing.seller?.avatarUrl || defaultAvatarUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = defaultAvatarUrl;
              }}
            />
            <div className={styles.sellerInfo}>
              <p className={styles.eyebrow}>Seller</p>
              <h2>
                <UserRound size={18} aria-hidden="true" />
                {listing.seller?.username || 'Unknown seller'}
              </h2>
              <span>
                <Clock3 size={16} aria-hidden="true" />
                {formatLastLogin(listing.seller?.lastLogin)}
              </span>
            </div>
          </section>

          <div>
            <p className={styles.eyebrow}>Listing details</p>
            <h1>{listing.title}</h1>
            <p className={styles.productLocation}>
              <MapPin size={18} aria-hidden="true" />
              {listing.place ? (listing.place) : ("Location not provided")}
            </p>
            <p className={styles.productUpdatedAt}>
              <Clock3 size={18} aria-hidden="true" />
              {formatRelativeTime(listing.updatedAt)}
            </p>
          </div>

          <p className={styles.productPrice}>
            {formatPrice(listing.price)}
          </p>

          <p className={styles.viewCount}>{listing.viewCount ?? 0} views</p>

          <div className={styles.productDescription}>
            <h2>Description</h2>
            <p>
              {listing.description}
            </p>
          </div>

          <div className={styles.productActions}>
            <button className={styles.contactButton} type="button">
              <MessageCircle size={18} aria-hidden="true" />
              Contact seller
            </button>
          </div>
        </article>
      </section>)}
    </main>
  );
}
