import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DTM PARTS — פגושים וטמבונים",
    short_name: "DTM PARTS",
    description: "פגושים, טמבונים ומגנים משומשים מייבוא לכל יצרני הרכב",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a2e",
    theme_color: "#1a1a2e",
    dir: "rtl",
    lang: "he",
    icons: [
      {
        src: "/images/logo.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/images/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
