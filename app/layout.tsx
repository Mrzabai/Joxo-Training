import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joxo-training.joakim-engholm.chatgpt.site"),
  title: "Joxo Training",
  description: "Jockes personliga träningsapp med Notion-schema, progression, kostlogg och PT-stöd.",
  applicationName: "Joxo Training",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Joxo Training",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
