'use client';

import Link from "next/link";
import styles from "./reg.module.css";





export default function RegisterPage() {







    return (
       <main>
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

        
      </main>
    );
}
