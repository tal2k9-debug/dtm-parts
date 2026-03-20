import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DTM PARTS — פגושים וטמבונים",
    short_name: "DTM PARTS",
    description: "פגושים, טמבונים ומגנים משומשים מייבוא לכל יצרני הרכב. מלאי של 2,900+ פריטים, מחירים תחרותיים, משלוח לכל הארץ.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1a2e",
    theme_color: "#1a1a2e",
    dir: "rtl",
    lang: "he",
    categories: ["auto", "shopping", "business"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/images/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "DTM PARTS — מלאי פגושים וטמבונים",
      },
      {
        src: "/images/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "DTM PARTS — מלאי פגושים וטמבונים",
      },
    ],
    shortcuts: [
      {
        name: "קטלוג פגושים",
        short_name: "קטלוג",
        url: "/catalog",
        icons: [{ src: "/images/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "בקשת מחיר",
        short_name: "הצעת מחיר",
        url: "/quote",
        icons: [{ src: "/images/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
