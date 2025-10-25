import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/components/AuthProvider";
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
    default: "Soundswoop – AI Music & Art Generator",
    template: "%s | Soundswoop"
  },
  description: "Create personalized AI-generated music and art in seconds. Soundswoop uses advanced AI to generate unique soundscapes and visuals based on your emotions and vibe. Free AI music and art creation app.",
  keywords: [
    "AI music generator",
    "create music with AI",
    "AI music creation app",
    "AI generated music",
    "music generator AI",
    "free AI music",
    "AI soundscape generator",
    "personalized AI music",
    "AI art generator",
    "Soundswoop",
    "AI music generation"
  ],
  authors: [{ name: "Soundswoop" }],
  creator: "Soundswoop",
  publisher: "Soundswoop",
  metadataBase: new URL("https://soundswoop.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://soundswoop.com",
    siteName: "Soundswoop",
    title: "Soundswoop – AI Music & Art Generator",
    description: "Create personalized AI-generated music and art in seconds. Free AI music and art creation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Soundswoop – AI Music & Art Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soundswoop – AI Music & Art Generator",
    description: "Create personalized AI-generated music and art in seconds. Free AI music and art creation.",
    images: ["/og-image.png"],
    creator: "@soundswoop",
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
              "name": "Soundswoop",
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
              "description": "Create personalized AI-generated music and art in seconds. Free AI music and art creation app.",
              "screenshot": "https://soundswoop.com/og-image.png",
              "featureList": [
                "AI Music Generation",
                "AI Art Generation",
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
              "name": "Soundswoop AI Music & Art Generator",
              "image": "https://soundswoop.com/og-image.png",
              "description": "AI-powered music and art generator that creates personalized soundscapes and visuals based on your emotions and vibe.",
              "brand": {
                "@type": "Brand",
                "name": "Soundswoop"
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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
