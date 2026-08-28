'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import styles from '../logon/logon.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password')?.toString() ?? '';
    const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/passwordReset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error ?? 'Password could not be reset.');
        return;
      }

      setMessage('Password reset. Redirecting to log in...');
      setTimeout(() => router.push('/auth/logon'), 900);
    } catch (error) {
      console.error('Password reset failed:', error);
      setMessage('Password reset service unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={resetPassword} className={styles.logOnForm}>
      <h2>New password</h2>
      <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      <h2>Confirm password</h2>
      <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      <button type="submit" disabled={isSubmitting || !token}>
        {isSubmitting ? 'Resetting...' : 'Reset password'}
      </button>
      {message ? <p className={styles.formMessage}>{message}</p> : null}
      {!token ? <p className={styles.formMessage}>Reset token is missing.</p> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.logOnPage}>
      <SiteHeader
        showAccountActions={false}
        actions={<Link className="register-link" href="/auth/logon">Log in</Link>}
      />
      <section className={styles.logOnSection}>
        <h1>Choose a new password</h1>
        <div className={styles.infoContainer}>
          <Suspense fallback={<p className={styles.formMessage}>Loading reset form...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
