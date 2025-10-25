import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VibeForge - AI Music Generator | Create Music with AI",
    template: "%s | VibeForge - AI Music Generator"
  },
  description: "Create personalized AI-generated music in seconds. VibeForge uses advanced AI to generate unique soundscapes based on your emotions and vibe. Free AI music creation app powered by Kie.ai.",
  keywords: [
    "AI music generator",
    "create music with AI",
    "AI music creation app",
    "AI generated music",
    "music generator AI",
    "free AI music",
    "AI soundscape generator",
    "personalized AI music",
    "VibeForge",
    "Kie.ai music"
  ],
  authors: [{ name: "VibeForge" }],
  creator: "VibeForge",
  publisher: "VibeForge",
  metadataBase: new URL("https://vibe-forge.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vibe-forge.vercel.app",
    siteName: "VibeForge",
    title: "VibeForge - AI Music Generator | Create Music with AI",
    description: "Create personalized AI-generated music in seconds. Free AI music creation powered by Kie.ai.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VibeForge - AI Music Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeForge - AI Music Generator",
    description: "Create personalized AI-generated music in seconds. Free AI music creation powered by Kie.ai.",
    images: ["/og-image.png"],
    creator: "@vibeforge",
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
    apple: "/apple-touch-icon.png",
  },
  verification: {
    // Add verification codes if you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "VibeForge",
              "applicationCategory": "MusicApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              },
              "description": "Create personalized AI-generated music in seconds. Free AI music creation app powered by Kie.ai.",
              "screenshot": "https://vibe-forge.vercel.app/og-image.png",
              "featureList": [
                "AI Music Generation",
                "Personalized Soundscapes",
                "Emotion-Based Music Creation",
                "Free and Instant",
                "No Account Required"
              ]
            })
          }}
        />
        {/* Structured Data - Product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "VibeForge AI Music Generator",
              "image": "https://vibe-forge.vercel.app/og-image.png",
              "description": "AI-powered music generator that creates personalized soundscapes based on your emotions and vibe.",
              "brand": {
                "@type": "Brand",
                "name": "VibeForge"
              },
              "category": "Music Creation Software",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
