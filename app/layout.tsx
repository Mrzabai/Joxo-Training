import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
    apple: "/icon.svg",
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
