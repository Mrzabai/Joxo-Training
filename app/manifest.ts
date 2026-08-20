import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Joxo Training",
    short_name: "Joxo",
    description: "Träningslogg, progression, kost och PT-stöd för Jocke.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a09",
    theme_color: "#c7ff32",
    lang: "sv-SE",
    orientation: "portrait",
    icons: [
      { src: "/joxo-app-icon-192-20260821.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/joxo-app-icon-512-20260821.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/joxo-app-icon-512-20260821.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
