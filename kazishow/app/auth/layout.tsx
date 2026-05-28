import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join KaziShow — Kenya's #1 Service Platform",
  description:
    "Create your free KaziShow account. Find verified service providers or register your business and start getting customers in Nairobi today.",
  alternates: { canonical: "https://kazishow.co.ke/auth/register" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
