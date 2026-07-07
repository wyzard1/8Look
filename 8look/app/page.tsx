'use client';

import { FormEvent, useState } from 'react';

type Listing = {
  id: number;
  title: string;
  description?: string;
  price?: number;
  place?: string;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setListing(null);

    try {
      const apiBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'http://spring-app:8080';
      const response = await fetch(`${apiBaseUrl}/listings/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Unable to fetch listing');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setListing(data[0]);
      } else {
        setError('No listing found for that ID.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Search listings by ID</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter listing ID"
          style={{ padding: '0.5rem', minWidth: '220px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p> : null}

      {listing ? (
        <section style={{ marginTop: '1.5rem', border: '1px solid #ddd', padding: '1rem', maxWidth: '420px' }}>
          <h2>{listing.title}</h2>
          <p>{listing.description ?? 'No description provided.'}</p>
          <p>Price: {listing.price ?? 'N/A'}</p>
          <p>Place: {listing.place ?? 'N/A'}</p>
        </section>
      ) : null}
    </main>
  );
}
