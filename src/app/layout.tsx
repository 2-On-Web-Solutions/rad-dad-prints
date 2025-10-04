import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// --- EDIT THIS TO YOUR REAL DOMAIN ---
const SITE_URL = "https://raddadprints.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rad Dad Prints | Custom 3D Printing Services",
    template: "%s | Rad Dad Prints",
  },
  description:
    "Rad Dad Prints offers affordable custom 3D printing, prototyping, and design services with fast turnaround and quality results.",
  keywords: [
    "3D printing",
    "custom 3D prints",
    "rapid prototyping",
    "resin printing",
    "PLA",
    "PETG",
    "ABS",
    "Halifax",
    "Nova Scotia",
    "Rad Dad Prints",
  ],
  authors: [{ name: "Rad Dad Prints" }],
  creator: "Rad Dad Prints",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Rad Dad Prints",
    title: "Rad Dad Prints | Custom 3D Printing Services",
    description:
      "Affordable custom 3D printing, prototyping, and design services with fast turnaround and quality results.",
    images: [
      {
        url: "/og-image.png", // 1200x630 recommended
        width: 1200,
        height: 630,
        alt: "Rad Dad Prints logo",
      },
    ],
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rad Dad Prints | Custom 3D Printing Services",
    description:
      "Affordable custom 3D printing, prototyping, and design services with fast turnaround and quality results.",
    images: ["/og-image.png"],
  },

  // ✅ Updated icon set
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
      { rel: "icon", url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rad Dad Prints",
    url: SITE_URL,
    // Use a square PNG for logo; apple-touch-icon is a good, high-res option
    logo: `${SITE_URL}/apple-touch-icon.png`,
    sameAs: [
      // Add social links when ready
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD for rich snippets */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}