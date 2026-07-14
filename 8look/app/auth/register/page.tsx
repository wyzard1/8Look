'use client';

import Link from "next/link";
import styles from "./reg.module.css";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";



export default function RegisterPage() {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      const storedTheme = localStorage.getItem('8look-theme');
      const useDark = storedTheme
        ? storedTheme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
    }, []);

    async function handleRegister(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setMessage('');
      setIsSubmitting(true);

      const form = event.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const username = formData.get('username')?.toString() ?? '';
      const email = formData.get('email')?.toString() ?? '';
      const phoneNumber = formData.get('phone-number')?.toString() ?? '';
      const password = formData.get('password')?.toString() ?? '';

      if(password.length < 8) {
        setMessage('Password must be at least 8 characters long.');
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch('/api/registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, phoneNumber, password }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setMessage(data?.error ?? 'Registration failed.');
          return;
        }

        form.reset();
        setMessage('Account created successfully. Please confirm email.');
      } catch (error) {
        console.error('Registration request failed:', error);
        setMessage('Registration service unavailable.');
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
       <div className={styles.registerPage}>
        <header className="site-header">
          <div className="header-top">
            <Link className="brand" href="/" aria-label="8look home">
              <span>8</span>look
            </Link>
    
           <div className={styles.loginLinkContainer}>
              <Link className="login-link" href="/auth/login">Log in</Link>
            </div>
          </div>
        </header>
        <section className={styles.registerSection}>
          <h1>Register an account</h1>
          <div className={styles.infoContainer}>
          <form onSubmit={handleRegister} className={styles.registerForm}>
          <h2>Username</h2>
          <input name="username" autoComplete="username" required />
          <h2>Email</h2>
          <input name="email" type="email" autoComplete="email" required />
          <h2>Phone Number</h2>
          <input name="phone-number" autoComplete="tel" required />
          <h2>Password</h2>
          <input name="password" type="password" autoComplete="new-password" required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
          {message ? <p className={styles.formMessage}>{message}</p> : null}
          </form>
          </div>



        </section>

      </div>
    );
}
