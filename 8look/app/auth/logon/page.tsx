'use client';

import Link from "next/link";
import styles from "./logon.module.css";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";


export default function LogOnPage() {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    async function handleLogOn(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setMessage('');
      setIsSubmitting(true);

      const form = event.currentTarget;
      const formData = new FormData(form);
      const email = formData.get('email')?.toString() ?? '';
      const password = formData.get('password')?.toString() ?? '';

      try {
        const response = await fetch('/api/logon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setMessage(data?.error ?? 'Log in failed.');
          return;
        }

        form.reset();
        setMessage('Logged in successfully.');

        router.push('/');
      } catch (error) {
        console.error('Log in request failed:', error);
        setMessage('Log in service unavailable.');
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
       <div className={styles.logOnPage}>
        <SiteHeader
          showAccountActions={false}
          actions={<Link className="register-link" href="/auth/register">Register</Link>}
        />
        <section className={styles.logOnSection}>
          <h1>Log in to 8look</h1>
          <div className={styles.infoContainer}>
          <form onSubmit={handleLogOn} className={styles.logOnForm}>
          <h2>Email</h2>
          <input name="email" type="email" autoComplete="email" required />
          <h2>Password</h2>
          <input name="password" type="password" autoComplete="current-password" required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
          {message ? <p className={styles.formMessage}>{message}</p> : null}
          </form>
          </div>
        </section>
      </div>
    );
}
