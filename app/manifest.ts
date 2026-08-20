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
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
