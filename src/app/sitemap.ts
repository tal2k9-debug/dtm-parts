import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://dtm-parts.com";

// Manufacturer slugs mapping
const MANUFACTURERS: Record<string, string> = {
  "הונדה": "honda",
  "סוזוקי": "suzuki",
  "טויוטה": "toyota",
  "ניסן": "nissan",
  "קיה": "kia",
  "אודי": "audi",
  "וולבו": "volvo",
  "מרצדס": "mercedes",
  "סקודה": "skoda",
  "פולקסווגן": "volkswagen",
  "במו": "bmw",
  "יונדאי": "hyundai",
  "מאזדה": "mazda",
  "סיאט": "seat",
  "מיצובישי": "mitsubishi",
  "שברולט": "chevrolet",
  "פיג'ו": "peugeot",
  "רנו": "renault",
  "סיטרואן": "citroen",
  "פורד": "ford",
  "אופל": "opel",
  "ג'יפ": "jeep",
  "לנד רובר": "land-rover",
  "פיאט": "fiat",
  "דייהטסו": "daihatsu",
  "סובארו": "subaru",
  "לקסוס": "lexus",
  "אינפיניטי": "infiniti",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/quote`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Manufacturer pages
  const manufacturerPages: MetadataRoute.Sitemap = Object.values(MANUFACTURERS).map((slug) => ({
    url: `${BASE_URL}/catalog/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Individual bumper pages (in-stock only for priority)
  let bumperPages: MetadataRoute.Sitemap = [];
  try {
    const bumpers = await prisma.bumperCache.findMany({
      select: { mondayItemId: true, lastSynced: true, status: true },
      where: { status: { in: ["כן", "במלאי", "yes"] } },
    });
    bumperPages = bumpers.map((b) => ({
      url: `${BASE_URL}/catalog/${b.mondayItemId}`,
      lastModified: b.lastSynced,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("Sitemap: Error fetching bumpers", e);
  }

  return [...staticPages, ...manufacturerPages, ...bumperPages];
}
