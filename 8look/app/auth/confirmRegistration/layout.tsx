import type { Metadata } from "next";
import styles from "./confirm.module.css";

export const metadata: Metadata = {
  title: "8look | Confirm Registration",
  description: "Create an account to browse local listings for cars, homes, jobs, tech, and more.",
};

const currentYear: number =  new Date().getFullYear();

export default function RegisterLayout({
  children,
}: 
  {children: React.ReactNode;})
 {
  return (
    <main className={styles.confirmLayout}>
    {children}
    <footer className={styles.footer}>
      <p>&copy; {currentYear} Built by Wyzard once, open source forever.</p>
    </footer>
    </main>
    
  );
}
