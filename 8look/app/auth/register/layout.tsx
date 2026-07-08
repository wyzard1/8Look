import type { Metadata } from "next";
import './reg.module.css';

export const metadata: Metadata = {
  title: "8look | Register",
  description: "Create an account to browse local listings for cars, homes, jobs, tech, and more.",
};

export default function RegisterLayout({
  children,
}: 
  {children: React.ReactNode;})
 {
  return (
    <main>{children}</main>
  );
}