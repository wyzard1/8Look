'use client';

import { Clock3, MapPin, Pencil, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SiteHeader, { defaultAvatarUrl, HeaderSearch } from '@/app/components/SiteHeader';
import { formatPrice, formatRelativeTime } from '@/lib/format';
import {
  safeFirstListingImageUrl,
  type PublicListing,
} from '@/lib/listings';
import styles from './user-listings.module.css';
import { useAuth } from '@/lib/auth';

type Seller = {
  id: number;
  username: string;
  avatarUrl?: string | null;
  lastLogin?: string | null;
  phoneNumber?: string | null;
};

type UserListingsResponse = {
  seller: Seller;
  listings: PublicListing[];
};

export default function UserListingsPage() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id;
  const isValidSellerId = /^\d+$/.test(sellerId);
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const isCurrentUserPage = Boolean(currentUser && Number(sellerId) === currentUser.id);

  
  const avatarUrl = useMemo(() => {
    const sellerAvatar = data?.seller.avatarUrl;
    return sellerAvatar && sellerAvatar !== failedAvatarUrl ? sellerAvatar : defaultAvatarUrl;
  }, [data?.seller.avatarUrl, failedAvatarUrl]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUserListings() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/listings/user/${sellerId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = typeof payload?.error === 'string'
            ? payload.error
            : response.status === 404
            ? 'Seller not found.'
            : 'Listings could not be loaded.';
          throw new Error(message);
        }

        const payload: UserListingsResponse = await response.json();
        setData(payload);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setData(null);
        setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (isValidSellerId) void loadUserListings();

    return () => controller.abort();
  }, [isValidSellerId, sellerId]);

  const visibleError = isValidSellerId ? error : 'Invalid seller id.';
  const isPageLoading = isValidSellerId && loading;

  return (
    <main>
      <SiteHeader search={<HeaderSearch />} />

      <section className={styles.sellerPage} aria-live="polite" aria-busy={isPageLoading}>
        {isPageLoading ? (
          <div className={styles.statusMessage}>
            <strong>Loading seller listings...</strong>
          </div>
        ) : visibleError || !data ? (
          <div className={`${styles.statusMessage} ${styles.error}`}>
            <strong>{visibleError || 'Seller listings unavailable.'}</strong>
          </div>
        ) : (
          <>
            <div className={styles.sellerPanel}>
              <img
                className={styles.sellerAvatar}
                src={avatarUrl}
                alt=""
                onError={() => {
                  if (avatarUrl !== defaultAvatarUrl) setFailedAvatarUrl(avatarUrl);
                }}
              />
              <div className={styles.sellerInfo}>
                <p className={styles.eyebrow}>Seller</p>
                <h1>{data.seller.username}</h1>
                <ul className={styles.sellerMeta}>
                  <li>
                    <Clock3 size={16} aria-hidden="true" />
                    {formatRelativeTime(data.seller.lastLogin)}
                  </li>
                  <li>
                    <Phone size={16} aria-hidden="true" />
                    {data.seller.phoneNumber || 'Phone not provided'}
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Marketplace</p>
                <h2>{data.seller.username}&apos;s listings</h2>
              </div>
              <span>{data.listings.length} listings</span>
            </div>

            {data.listings.length > 0 ? (
              <div className={styles.listingGrid}>
                {data.listings.map((listing) => (
                  <article className={styles.listingCard} key={listing.id}>
                    <Link className={styles.listingLink} href={`/listing/${listing.id}`}>
                      <div className={styles.listingImageWrap}>
                        <img src={safeFirstListingImageUrl(listing.images)} alt="" />
                      </div>
                      <div className={styles.listingContent}>
                        <h3>{listing.title || 'Untitled listing'}</h3>
                        <p className={styles.listingDetail}>
                          <MapPin size={16} aria-hidden="true" />
                          {listing.place || 'Location not provided'}
                        </p>
                        <p className={styles.listingDetail}>
                          <Clock3 size={16} aria-hidden="true" />
                          {formatRelativeTime(listing.updatedAt)}
                        </p>
                        <p className={styles.price}>{formatPrice(listing.price)}</p>
                      </div>
                    </Link>
                    {isCurrentUserPage && (
                      <div className={styles.cardActions}>
                        <Link className={styles.editButton} href={`/listing/edit/${listing.id}`}>
                          <Pencil size={16} aria-hidden="true" />
                          Edit listing
                        </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.statusMessage}>
                <strong>No listings from this seller.</strong>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
