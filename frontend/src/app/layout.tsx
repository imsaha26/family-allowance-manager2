import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";

import "./globals.css";

// ── Fonts ────────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Family Allowance Manager",
    template: "%s | Family Allowance Manager",
  },
  description:
    "Decentralized family financial management on the Stellar blockchain. Automate recurring allowances, enforce spending rules, and maintain tamper-proof financial records with Soroban smart contracts.",
  keywords: [
    "stellar",
    "soroban",
    "blockchain",
    "family allowance",
    "defi",
    "smart contracts",
    "crypto",
    "web3 finance",
  ],
  authors: [{ name: "Family Allowance Manager" }],
  creator: "Family Allowance Manager",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    siteName: "Family Allowance Manager",
    title: "Family Allowance Manager",
    description:
      "Automate recurring allowances for your family on the Stellar blockchain.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Family Allowance Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Allowance Manager",
    description:
      "Automate recurring allowances for your family on the Stellar blockchain.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080e1a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Providers from "./providers";

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
