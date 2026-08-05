'use client';

import {
  MapPin,
  MessageCircle,
} from 'lucide-react';
import SiteHeader, { HeaderSearch } from '../../components/SiteHeader';
import styles from './listing.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ApiListing } from '@/app/api/listing/[id]/route';
import { formatPrice } from '@/app/page';

const fallbackImage = '/listing-placeholder.png';

function safeImageUrl(image?: string | null) {
  if (!image) return fallbackImage;

  try {
    const url = new URL(image);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : fallbackImage;
  } catch {
    return fallbackImage;
  }
}

export default function ProductPage() {
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
          <div>
            <p className={styles.eyebrow}>Listing details</p>
            <h1>{listing.title}</h1>
            <p className={styles.productLocation}>
              <MapPin size={18} aria-hidden="true" />
              {listing.place ? (listing.place) : ("Location not provided")}
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
