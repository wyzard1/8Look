'use client';

import {
  Heart,
  Newspaper,
  Moon,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  LogOut,
  Sun,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser, type User } from '@/lib/auth';
import Dropdown, { DropdownItem } from '../../components/Dropdown';
import { useRouter } from 'next/navigation';
import styles from './listing.module.css';

export default function ProductPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userImage] = useState('/default-user-avatar.ico');
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      const user = await getCurrentUser();
      if (!ignore) setCurrentUser(user);
    }

    void loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, []);

  async function logOut() {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      return;
    }

    setCurrentUser(null);
    router.refresh();
  }

  function toggleTheme() {
    const nextDarkMode = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light';
    localStorage.setItem('8look-theme', nextDarkMode ? 'dark' : 'light');
  }

  return (
    <main>
      <header className="site-header">
        <div className="header-top">
          <Link className="brand" href="/" aria-label="8look home">
            <span>8</span>look
          </Link>

          <form className="search-form" role="search">
            <Search aria-hidden="true" size={20} />
            <input
              aria-label="Search listings"
              autoComplete="off"
              maxLength={20}
              placeholder="What are you looking for?"
            />
          </form>

          <div className="account-actions">
            <button className="theme-button" type="button" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle color theme">
              <Sun className="sun-icon" size={20} />
              <Moon className="moon-icon" size={20} />
            </button>   
            {currentUser ? (
              <div className="profile-container">
                <span className="login-link">{currentUser.username}</span>
                <Dropdown
                  trigger={(
                    <button className="menu-button" type="button">
                      <Image src={userImage} alt="" width={40} height={40} />
                    </button>
                  )}
                >
                  <DropdownItem>
                    <Settings size={16} aria-hidden="true" />
                    <Link href="/profile">Profile options</Link>
                  </DropdownItem>
                  <DropdownItem>
                    <Newspaper size={16} aria-hidden="true" />
                    <Link href="/profile">New listing</Link>
                  </DropdownItem>
                  <DropdownItem>
                    <LogOut size={16} aria-hidden="true" />
                    <button type="button" onClick={logOut}>Log out</button>
                  </DropdownItem>
                </Dropdown>
              </div>
            ) : (
              <>
                <Link className="login-link" href="/auth/logon">Log in</Link>
                <Link className="register-link" href="/auth/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

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
                            Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.
                            Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.
                            Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.
                            Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.              Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.              Add the product description here. This area is ready for listing
              details such as condition, size, features, pickup options, and
              anything else a buyer should know before contacting the seller.
            </p>
          </div>

          <div className={styles.productActions}>
            <button className={styles.contactButton} type="button">
              <MessageCircle size={18} aria-hidden="true" />
              Contact seller
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
