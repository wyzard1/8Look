'use client';

import Link from "next/link";
import Form from "next/form";
import styles from "./reg.module.css";
import { useEffect } from "react";



const onSubmit = () => {};

export default function RegisterPage() {

    useEffect(() => {
      const storedTheme = localStorage.getItem('8look-theme');
      const useDark = storedTheme
        ? storedTheme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
    }, []);

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
          <Form action={onSubmit} className={styles.registerForm}>
          <h2>Username</h2>
          <input name="username" />
          <h2>Email</h2>
          <input name="email" />
          <h2>Phone Number</h2>
          <input name="phone-number" />
          <h2>Password</h2>
          <input name="password" type="password" />
          <button type="submit">Register</button>
          </Form>
          </div>



        </section>

      </div>
    );
}
