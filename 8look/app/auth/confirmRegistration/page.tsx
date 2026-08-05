'use client'
import { useState } from "react";
import styles from "./confirm.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";


export default function RegisterConfirmPage()
{

    const [message, setMessage] = useState('')

    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? ""

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
         <SiteHeader
          showAccountActions={false}
          actions={<Link className="login-link" href="/auth/logon">Log in</Link>}
        />
        <div className = {styles.buttonContainer}>
          {(token === '' || token === null) ? <h1>Error: no confirmation token</h1>: 
          <><button className={styles.verifyButton} onClick={() => confirmRegistration(token)}>Verify Account</button><h1>{message}</h1></>}
        
        </div>



        </div>
     )
}
