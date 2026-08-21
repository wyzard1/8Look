'use client';

import { LayoutList, LogOut, Moon, Newspaper, Search, Settings, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, type FormEventHandler, type ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import Dropdown, { DropdownItem } from './Dropdown';

export const defaultAvatarUrl = "/default-user-avatar.png";

type SiteHeaderProps = {
  search?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  showAccountActions?: boolean;
};

export default function SiteHeader({
  search,
  children,
  actions,
  showAccountActions = true,
}: SiteHeaderProps) {

  const { user: currentUser, isLoadingUser, refreshUser } = useAuth();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const router = useRouter();
  const avatarUrl = currentUser?.avatarUrl && currentUser.avatarUrl !== failedAvatarUrl
    ? currentUser.avatarUrl
    : defaultAvatarUrl;
  const hasSearch = Boolean(search);


  useEffect(() => {
    const storedTheme = localStorage.getItem('8look-theme');
    const useDark = storedTheme
      ? storedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
  }, []);

  async function logOut() {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) return;

    await refreshUser();
    router.refresh();
  }

  function toggleTheme() {
    const nextDarkMode = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light';
    localStorage.setItem('8look-theme', nextDarkMode ? 'dark' : 'light');
  }

  return (
    <header className="site-header">
      <div className={`header-top ${hasSearch ? '' : 'header-top--no-search'}`}>
        <Link className="brand" href="/" aria-label="8look home">
          <span>8</span>look
        </Link>

        {search}

        <div className="account-actions">
          {showAccountActions && (
            <button className="theme-button" type="button" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle color theme">
              <Sun className="sun-icon" size={20} />
              <Moon className="moon-icon" size={20} />
            </button>
          )}
          {actions ?? (showAccountActions ? (
            isLoadingUser ? <div /> : currentUser ? (
              <div className="profile-container">
                <span className="login-link">{currentUser.username}</span>
                <Dropdown
                  trigger={(
                    <button className="menu-button" type="button">
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        onError={() => {
                          if (avatarUrl !== defaultAvatarUrl) {
                            setFailedAvatarUrl(avatarUrl);
                          }
                        }}
                      />
                    </button>
                  )}
                >
                  <DropdownItem>
                    <Settings size={16} aria-hidden="true" />
                    <Link href="/account">Profile options</Link>
                  </DropdownItem>
                  <DropdownItem>
                    <Newspaper size={16} aria-hidden="true" />
                    <Link href="/listing/create">New listing</Link>
                  </DropdownItem>
                  <DropdownItem>
                    <LayoutList size={16} aria-hidden="true" />
                    <Link href={`/listing/user/${currentUser.id}`}>My Listings</Link>
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
            )
          ) : null)}
        </div>
      </div>

      {children}
    </header>
  );
}

export function HeaderSearch({
  children,
  onSubmit,
}: {
  children?: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}) {
  const router = useRouter();
  const [defaultQuery, setDefaultQuery] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onSubmit) {
      onSubmit(event);
      return;
    }

    event.preventDefault();
    const cleanQuery = defaultQuery.trim();
    router.push(cleanQuery ? `/?query=${encodeURIComponent(cleanQuery)}` : '/');
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <Search aria-hidden="true" size={20} />
      {children ?? (
        <input
          aria-label="Search listings"
          autoComplete="off"
          maxLength={20}
          placeholder="What are you looking for?"
          value={defaultQuery}
          onChange={(event) => setDefaultQuery(event.target.value)}
        />
      )}
    </form>
  );
}
