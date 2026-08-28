import type { Metadata } from 'next';
import styles from '../logon/logon.module.css';

export const metadata: Metadata = {
  title: '8look | Reset password',
  description: 'Request a password reset link for your 8look account.',
};

const currentYear = new Date().getFullYear();

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className={styles.logOnLayout}>
      {children}
      <footer className={styles.footer}>
        <p>&copy; {currentYear} Built by Wyzard once, open source forever.</p>
      </footer>
    </main>
  );
}
