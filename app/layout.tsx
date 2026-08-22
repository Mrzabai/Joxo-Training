import type { Metadata } from "next";
import "./globals.css";
import { APP_ICON_DATA_URL, APP_INSTALL_VERSION, APPLE_TOUCH_ICON_PATH } from "./lib/app-icon";

const productionUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
  ?? "https://joxo-training.joakim-engholm.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: "Joxo Training",
  description: "Jockes personliga träningsapp med träningsschema, progression, kostlogg och PT-stöd.",
  applicationName: "Joxo Training",
  appleWebApp: {
    capable: true,
    title: "Joxo Training",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: APP_ICON_DATA_URL, sizes: "any", type: "image/svg+xml" },
      { url: "/joxo-favicon-20260821.ico", sizes: "any", type: "image/x-icon" },
      { url: "/joxo-app-icon-192-20260821.png", sizes: "192x192", type: "image/png" },
      { url: "/joxo-app-icon-512-20260821.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/joxo-favicon-20260821.ico",
    apple: [{ url: APPLE_TOUCH_ICON_PATH, sizes: "180x180", type: "image/png" }],
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
        <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('joxo-theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}" }} />
        <meta name="theme-color" content="#080a09" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f2f5ec" media="(prefers-color-scheme: light)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Joxo Training" />
        <link rel="manifest" href={`/${APP_INSTALL_VERSION}.webmanifest`} />
        <link rel="icon" type="image/svg+xml" sizes="any" href={APP_ICON_DATA_URL} />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href={APPLE_TOUCH_ICON_PATH} />
      </head>
      <body>{children}</body>
    </html>
  );
}
