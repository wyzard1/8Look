'use client';

import {
  Heart,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import Image from 'next/image';
import SiteHeader, { HeaderSearch } from '../../components/SiteHeader';
import styles from './listing.module.css';

export default function ProductPage() {
  return (
    <main>
      <SiteHeader search={<HeaderSearch />} />

      <section className={styles.productPage}>
        <div className={styles.productGallery}>
          <div className={styles.productImageWrap}>
            <Image src="/listing-placeholder.png" alt="" fill priority sizes="(max-width: 960px) 100vw, 60vw" />
          </div>
          <div className={styles.productThumbnails} aria-label="Listing photos">
            <button className={styles.active} type="button">
              <Image src="/listing-placeholder.png" alt="" fill sizes="33vw" />
            </button>
            <button type="button">
              <Image src="/listing-placeholder.png" alt="" fill sizes="33vw" />
            </button>
            <button type="button">
              <Image src="/listing-placeholder.png" alt="" fill sizes="33vw" />
            </button>
          </div>
        </div>


        <article className={styles.productDetails}>
          <div>
            <p className={styles.eyebrow}>Listing details</p>
            <h1>Product title</h1>
            <p className={styles.productLocation}>
              <MapPin size={18} aria-hidden="true" />
              Location not provided
            </p>
          </div>

          <p className={styles.productPrice}>Price on request</p>

          <p className={styles.viewCount}>0 views</p>

          <div className={styles.productDescription}>
            <h2>Description</h2>
            <p>
              Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.
            </p>
          </div>

          <div className={styles.productActions}>
            <button className={styles.contactButton} type="button">
              <MessageCircle size={18} aria-hidden="true" />
              Contact seller
            </button>
            <button className={styles.saveButton} type="button" aria-label="Save listing" title="Save listing">
              <Heart size={18} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
