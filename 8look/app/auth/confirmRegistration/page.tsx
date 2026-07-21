'use client'
import { useEffect, useState } from "react";
import styles from "./confirm.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";


export default function RegisterConfirmPage()
{

    const [message, setMessage] = useState('')

    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? ""

    useEffect(() => {
          const storedTheme = localStorage.getItem('8look-theme');
          const useDark = storedTheme
            ? storedTheme === 'dark'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
        }, []);

    async function confirmRegistration(token: string)
    {
        setMessage('')
        try{
        const params = token ? `?token=${encodeURIComponent(token)}` : '';
        const response = await fetch(`/api/confirmRegistration${params}`);
        if(!response.ok)
        {
            setMessage(response.status === 408 ? 'Request expired!' : 'Invalid request');
            return;
        }
        setMessage("Account verified!")
        }
        catch{}
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
        <div className = {styles.buttonContainer}>
          {(token === '' || token === null) ? <h1>Error: no confirmation token</h1>: 
          <><button className={styles.verifyButton} onClick={() => confirmRegistration(token)}>Verify Account</button><h1>{message}</h1></>}
        
        </div>



        </div>
     )
}
