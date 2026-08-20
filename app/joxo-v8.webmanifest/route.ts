import { APP_ICON_DATA_URL, APP_INSTALL_VERSION } from "../lib/app-icon";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      name: "Joxo Training",
      short_name: "Joxo",
      description: "Träningslogg, progression, kost och PT-stöd för Jocke.",
      id: `/${APP_INSTALL_VERSION}`,
      start_url: `/?install=${APP_INSTALL_VERSION}`,
      display: "standalone",
      background_color: "#080a09",
      theme_color: "#c7ff32",
      lang: "sv-SE",
      orientation: "portrait",
      icons: [
        { src: APP_ICON_DATA_URL, sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/joxo-app-icon-192-20260821.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/joxo-app-icon-512-20260821.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/joxo-app-icon-512-20260821.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/manifest+json; charset=utf-8",
      },
    },
  );
}
