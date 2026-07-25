'use client';

import {
  Newspaper,
  Moon,
  Search,
  Settings,
  LogOut,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser, type User } from '@/lib/auth';
import Dropdown, { DropdownItem } from '../../components/Dropdown';
import { useRouter } from 'next/navigation';


function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'Price on request';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userImage, setUserImage] = useState('/default-user-avatar.ico');
  const [error, setError] = useState('');
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
      setError('Log out failed. Please try again.');
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
                      <img src={userImage} alt="" />
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
            <h1>TEMPLATE</h1>
    </main>
  );
}
