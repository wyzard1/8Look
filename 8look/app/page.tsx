'use client';

import {
  BriefcaseBusiness,
  CarFront,
  Dumbbell,
  House,
  Laptop,
  MapPin,
  Moon,
  Search,
  Shirt,
  Sun,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Listing = {
  id: number;
  categoryId?: number | null;
  title: string;
  price?: number | null;
  place?: string | null;
  images?: string[] | null;
};

type User = 
{
  userid: number;
  email: string;
  username: string;
  avatar_url?: string;
}

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

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'Price on request';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setLoggedin] = useState(false)
  const categoryNavRef = useRef<HTMLElement>(null);
  const categoryIndicatorRef = useRef<HTMLSpanElement>(null);


  useLayoutEffect(() => {
    const nav = categoryNavRef.current;
    const indicator = categoryIndicatorRef.current;
    const activeButton = nav?.querySelector<HTMLButtonElement>('button.active');

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
    const storedTheme = localStorage.getItem('8look-theme');
    const useDark = storedTheme
      ? storedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
  }, []);

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
    cleanQuery ? setHasSearched(true) : setHasSearched(false);
    if (cleanQuery && (cleanQuery.length < 3 || cleanQuery.length > 20)) {
      setListings([]);
      setError('Use 3 to 20 characters for search.');
      return;
    }
    void loadListings(cleanQuery);
  }

  function toggleTheme() {
    const nextDarkMode = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light';
    localStorage.setItem('8look-theme', nextDarkMode ? 'dark' : 'light');
  }

  const visibleListings = useMemo(
    () => selectedCategory === null
      ? listings
      : listings.filter((listing) => listing.categoryId === selectedCategory),
    [listings, selectedCategory],
  );

  return (
    <main>
      <header className="site-header">
        <div className="header-top">
          <Link className="brand" href="/" aria-label="8look home">
            <span>8</span>look
          </Link>

          <form className="search-form" onSubmit={handleSearch} role="search">
            <Search aria-hidden="true" size={20} />
            <input
              aria-label="Search listings"
              autoComplete="off"
              maxLength={20}
              placeholder="What are you looking for?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>

          <div className="account-actions">
            <button className="theme-button" type="button" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle color theme">
              <Sun className="sun-icon" size={20} />
              <Moon className="moon-icon" size={20} />
            </button>
            <Link className="login-link" href="/auth/logon">Log in</Link>
            <Link className="register-link" href="/auth/register">Register</Link>
          </div>
        </div>

        <nav className="category-nav" aria-label="Listing categories"
          ref={categoryNavRef}>
            <span
                ref={categoryIndicatorRef}
                className="category-indicator"
                aria-hidden="true"
              />
          <button
            className={selectedCategory === null ? 'active' : ''}
            type="button"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              className={selectedCategory === id ? 'active' : ''}
              type="button"
              key={id}
              onClick={() => setSelectedCategory(id)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <section className="listing-section" aria-live="polite" aria-busy={loading}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Marketplace</p>
            <h1>{hasSearched ? 'Search results' : 'Fresh listings'}</h1>
          </div>
          {!loading && !error && <span>{visibleListings.length} listings</span>}
        </div>

        {error && (
          <div className="status-message error" role="alert">
            <strong>We hit a snag.</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="category-results" key={selectedCategory ?? 'all'}>
          {loading ? (
            <div className="listing-grid" aria-label="Loading listings">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="listing-card skeleton" key={index} />
              ))}
            </div>
          ) : visibleListings.length > 0 ? (
            <div className="listing-grid category-transition">
              {visibleListings.map((listing) => (
                <article className="listing-card" key={listing.id}>
                  <div className="listing-image-wrap">
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
                  <div className="listing-content">
                    <h2>{listing.title || 'Untitled listing'}</h2>
                    <p className="place"><MapPin size={16} aria-hidden="true" />{listing.place || 'Location not provided'}</p>
                    <p className="price">{formatPrice(listing.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : !error ? (
            <div className="status-message category-transition">
              <strong>No listings found.</strong>
              <span>Try a broader search or choose another category.</span>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
