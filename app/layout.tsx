import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chill Talkativer",
  description: "A zero-pressure conversation gym.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
