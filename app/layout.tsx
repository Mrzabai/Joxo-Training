import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joxo-training.joakim-engholm.chatgpt.site"),
  title: "Joxo Training",
  description: "Jockes personliga träningsapp med träningsschema, progression, kostlogg och PT-stöd.",
  applicationName: "Joxo Training",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Joxo Training",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Joxo Training",
    description: "Styrka, progression och kost i en personlig träningsapp.",
    url: "/",
    siteName: "Joxo Training",
    locale: "sv_SE",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Joxo Training – styrka, progression och kost" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Joxo Training",
    description: "Styrka, progression och kost i en personlig träningsapp.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#080a09" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Joxo Training" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png?v=2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
