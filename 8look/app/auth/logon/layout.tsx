import type { Metadata } from "next";
import styles from './logon.module.css';

export const metadata: Metadata = {
  title: "8look | Log in",
  description: "Log in to browse local listings for cars, homes, jobs, tech, and more.",
};

const currentYear: number =  new Date().getFullYear();


export default function LogOnLayout({
  children,
}: 
  {children: React.ReactNode;})
 {
  return (
    <main className={styles.logOnLayout}>
      {children}
      <footer className={styles.footer}>
      <p>&copy; {currentYear} Built by Wyzard once, open source forever.</p>
    </footer>
    </main>
  );
}
