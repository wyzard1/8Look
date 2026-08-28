'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import styles from '../logon/logon.module.css';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email')?.toString() ?? '';

    try {
      const response = await fetch('/api/passwordReset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error ?? 'Password reset could not be requested.');
        return;
      }

      form.reset();
      setMessage('If an account exists for that email, a reset link has been sent.');
    } catch (error) {
      console.error('Password reset request failed:', error);
      setMessage('Password reset service unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.logOnPage}>
      <SiteHeader
        showAccountActions={false}
        actions={<Link className="register-link" href="/auth/logon">Log in</Link>}
      />
      <section className={styles.logOnSection}>
        <h1>Reset your password</h1>
        <div className={styles.infoContainer}>
          <form onSubmit={requestPasswordReset} className={styles.logOnForm}>
            <h2>Email</h2>
            <input name="email" type="email" autoComplete="email" required />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
            {message ? <p className={styles.formMessage}>{message}</p> : null}
          </form>
        </div>
      </section>
    </div>
  );
}
