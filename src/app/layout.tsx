import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Cahyo Architecture — Arsitektur & Desain Interior',
    template: '%s — Cahyo Architecture',
  },
  description: 'Studio arsitektur yang berfokus pada desain hunian dan komersial yang fungsional, estetis, dan berkelanjutan.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Cahyo Architecture',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
