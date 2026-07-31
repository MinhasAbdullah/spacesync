import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceSync — Resource Booking",
  description: "Conflict-free booking for shared campus and office resources.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-full">{children}</body></html>;
}
