'use client';

import {
  BriefcaseBusiness,
  CarFront,
  Clock3,
  Dumbbell,
  House,
  Laptop,
  ListFilter,
  MapPin,
  Shirt,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SiteHeader, { HeaderSearch } from './components/SiteHeader';
import styles from './home.module.css';
import { formatPrice, formatRelativeTime } from '@/lib/format';

type Listing = {
  id: number;
  categoryId?: number | null;
  title: string;
  price?: number | null;
  place?: string | null;
  updatedAt?: string | null;
  images?: string[] | null;
};

const categories = [
  { id: 1, label: 'Immovables', icon: Warehouse },
  { id: 2, label: 'Cars', icon: CarFront },
  { id: 3, label: 'Jobs', icon: BriefcaseBusiness },
  { id: 4, label: 'Tech', icon: Laptop },
  { id: 5, label: 'Home', icon: House },
  { id: 6, label: 'Sports', icon: Dumbbell },
  { id: 7, label: 'Clothing', icon: Shirt },
] as const;

const fallbackImage = '/listing-placeholder.png';
type PriceSort = 'newest' | 'price-asc' | 'price-desc';

function safeImageUrl(images?: string[] | null) {
  const candidate = images?.[0];
  if (!candidate) return fallbackImage;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : fallbackImage;
  } catch {
    return fallbackImage;
  }
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceSort, setPriceSort] = useState<PriceSort>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categoryNavRef = useRef<HTMLElement>(null);
  const categoryIndicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const nav = categoryNavRef.current;
    const indicator = categoryIndicatorRef.current;
    const activeButton = nav?.querySelector<HTMLButtonElement>(`button.${styles.active}`);

    if (!indicator || !activeButton || !nav) return;

    const positionIndicator = () => {
      const navRect = nav.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const left = buttonRect.left - navRect.left + nav.scrollLeft;
      indicator.style.width = `${buttonRect.width}px`;
      indicator.style.transform = `translate3d(${left}px, 0, 0)`;
    };
 
    positionIndicator();
    const resizeObserver = new ResizeObserver(positionIndicator);
    resizeObserver.observe(nav);

    return () => resizeObserver.disconnect();
  }, [selectedCategory]);
  useEffect(() => {
    const controller = new AbortController();
    void loadListings('', controller.signal);
    return () => controller.abort();
  }, []);

  async function loadListings(searchQuery: string, signal?: AbortSignal) {
    setLoading(true);
    setError('');

    try {
      const params = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/listings${params}`, { signal });
      if (!response.ok) {
        const message = response.status === 400
          ? 'Use 3 to 20 letters, numbers, spaces, or hyphens.'
          : 'Listings could not be loaded. Please try again.';
        throw new Error(message);
      }

      const data: unknown = await response.json();
      setListings(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setListings([]);
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  const [hasSearched, setHasSearched] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuery = query.trim();
    setHasSearched(Boolean(cleanQuery));
    if (cleanQuery && (cleanQuery.length < 3 || cleanQuery.length > 20)) {
      setListings([]);
      setError('Use 3 to 20 characters for search.');
      return;
    }
    void loadListings(cleanQuery);
  }

  const visibleListings = useMemo(() => {
    const cleanLocation = locationFilter.trim().toLowerCase();
    const minimumPrice = minPrice.trim() === '' ? null : Number(minPrice);
    const maximumPrice = maxPrice.trim() === '' ? null : Number(maxPrice);

    const filteredListings = listings.filter((listing) => {
      if (selectedCategory !== null && listing.categoryId !== selectedCategory) return false;

      if (cleanLocation && !listing.place?.toLowerCase().includes(cleanLocation)) return false;

      if (minimumPrice !== null || maximumPrice !== null) {
        if (typeof listing.price !== 'number' || !Number.isFinite(listing.price)) return false;
        if (minimumPrice !== null && Number.isFinite(minimumPrice) && listing.price < minimumPrice) return false;
        if (maximumPrice !== null && Number.isFinite(maximumPrice) && listing.price > maximumPrice) return false;
      }

      return true;
    });

    if (priceSort === 'newest') return filteredListings;

    return [...filteredListings].sort((firstListing, secondListing) => {
      const firstHasPrice = typeof firstListing.price === 'number' && Number.isFinite(firstListing.price);
      const secondHasPrice = typeof secondListing.price === 'number' && Number.isFinite(secondListing.price);

      if (!firstHasPrice && !secondHasPrice) return 0;
      if (!firstHasPrice) return 1;
      if (!secondHasPrice) return -1;

      const firstPrice = firstListing.price ?? 0;
      const secondPrice = secondListing.price ?? 0;

      return priceSort === 'price-asc'
        ? firstPrice - secondPrice
        : secondPrice - firstPrice;
    });
  }, [listings, locationFilter, maxPrice, minPrice, priceSort, selectedCategory]);

  function clearFilters() {
    setLocationFilter('');
    setMinPrice('');
    setMaxPrice('');
    setPriceSort('newest');
  }

  return (
    <main>
      <SiteHeader
        search={(
          <HeaderSearch onSubmit={handleSearch}>
            <input
              aria-label="Search listings"
              autoComplete="off"
              maxLength={20}
              placeholder="What are you looking for?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </HeaderSearch>
        )}
      >

        <nav className={styles.categoryNav} aria-label="Listing categories"
          ref={categoryNavRef}>
            <span
                ref={categoryIndicatorRef}
                className={styles.categoryIndicator}
                aria-hidden="true"
              />
          <button
            className={selectedCategory === null ? styles.active : ''}
            type="button"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              className={selectedCategory === id ? styles.active : ''}
              type="button"
              key={id}
              onClick={() => setSelectedCategory(id)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </SiteHeader>

      <section className={styles.listingSection} aria-live="polite" aria-busy={loading}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Marketplace</p>
            <h1>{hasSearched ? 'Search results' : 'Fresh listings'}</h1>
          </div>
          {!loading && !error && <span>{visibleListings.length} listings</span>}
        </div>

        <div className={styles.filterBar} aria-label="Listing filters">
          <div className={styles.filterTitle}>
            <ListFilter size={18} aria-hidden="true" />
            <span>Filters</span>
          </div>

          <label className={styles.filterField}>
            <span>Location</span>
            <input
              autoComplete="off"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              placeholder="Any place"
            />
          </label>

          <label className={styles.filterField}>
            <span>Min price</span>
            <input
              inputMode="decimal"
              min="0"
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0"
            />
          </label>

          <label className={styles.filterField}>
            <span>Max price</span>
            <input
              inputMode="decimal"
              min="0"
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="No limit"
            />
          </label>

          <label className={styles.filterField}>
            <span>Sort</span>
            <select value={priceSort} onChange={(event) => setPriceSort(event.target.value as PriceSort)}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>

          <button className={styles.clearFilters} type="button" onClick={clearFilters}>
            Reset
          </button>
        </div>

        {error && (
          <div className={`${styles.statusMessage} ${styles.error}`} role="alert">
            <strong>We hit a snag.</strong>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.categoryResults} key={selectedCategory ?? 'all'}>
          {loading ? (
            <div className={styles.listingGrid} aria-label="Loading listings">
              {Array.from({ length: 8 }, (_, index) => (
                <div className={`${styles.listingCard} ${styles.skeleton}`} key={index} />
              ))}
            </div>
          ) : visibleListings.length > 0 ? (
            <div className={`${styles.listingGrid} ${styles.categoryTransition}`}>
              {visibleListings.map((listing) => (
                <Link className={styles.listingCard} href={`/listing/${listing.id}`} key={listing.id}>
                  <div className={styles.listingImageWrap}>
                    <img
                      src={safeImageUrl(listing.images)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                    />
                  </div>
                  <div className={styles.listingContent}>
                    <h2>{listing.title || 'Untitled listing'}</h2>
                    <p className={styles.place}><MapPin size={16} aria-hidden="true" />{listing.place || 'Location not provided'}</p>
                    <p className={styles.updatedAt}><Clock3 size={16} aria-hidden="true" />{formatRelativeTime(listing.updatedAt)}</p>
                    <p className={styles.price}>{formatPrice(listing.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : !error ? (
            <div className={`${styles.statusMessage} ${styles.categoryTransition}`}>
              <strong>No listings found.</strong>
              <span>Try a broader search or choose another category.</span>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
