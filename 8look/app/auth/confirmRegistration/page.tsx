'use client'
import { useEffect } from "react";
import styles from "./confirm.module.css";
import Link from "next/link";



export default function RegisterConfirmPage()
{

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
        <div className = {styles.buttonContainer}>
        <button className = {styles.verifyButton} >Verify Account</button>
        </div>



        </div>
     )
}
