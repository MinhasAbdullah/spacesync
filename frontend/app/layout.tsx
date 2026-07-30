import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpaceSync — Seamless Access to Global Frontiers",
  description:
    "SpaceSync brings smart facility management to modern campuses, departments and towns. Real-time availability, no double-bookings, AI-powered insights.",
  keywords: ["campus management", "space booking", "facility management", "smart campus"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
