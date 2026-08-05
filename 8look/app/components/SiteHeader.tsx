'use client';

import { LogOut, Moon, Newspaper, Search, Settings, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, type ReactNode, useEffect, useState } from 'react';
import { getCurrentUser, type User } from '@/lib/auth';
import Dropdown, { DropdownItem } from './Dropdown';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(showAccountActions);
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem('8look-theme');
    const useDark = storedTheme
      ? storedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
  }, []);

  useEffect(() => {
    if (!showAccountActions) return;

    let ignore = false;

    async function loadCurrentUser() {
      const user = await getCurrentUser();
      if (!ignore) {
        setCurrentUser(user);
        setIsLoadingUser(false);
      }
    }

    void loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [showAccountActions]);

  async function logOut() {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) return;

    setCurrentUser(null);
    router.refresh();
  }

  function toggleTheme() {
    const nextDarkMode = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light';
    localStorage.setItem('8look-theme', nextDarkMode ? 'dark' : 'light');
  }

  return (
    <header className="site-header">
      <div className="header-top">
        <Link className="brand" href="/" aria-label="8look home">
          <span>8</span>look
        </Link>

        {search ?? <div />}

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
                      <Image src="/default-user-avatar.ico" alt="" width={40} height={40} />
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
  return (
    <form className="search-form" onSubmit={onSubmit} role="search">
      <Search aria-hidden="true" size={20} />
      {children ?? (
        <input
          aria-label="Search listings"
          autoComplete="off"
          maxLength={20}
          placeholder="What are you looking for?"
        />
      )}
    </form>
  );
}
