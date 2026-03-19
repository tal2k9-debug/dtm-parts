// Manufacturer slug ↔ Hebrew name mapping
export interface ManufacturerInfo {
  slug: string;
  nameHe: string;
  nameEn: string;
  description: string;
  popularModels: string[];
}

export const MANUFACTURERS: ManufacturerInfo[] = [
  { slug: "honda", nameHe: "הונדה", nameEn: "Honda", description: "סיוויק, ג'אז, CR-V, אקורד, HR-V ועוד", popularModels: ["סיוויק", "ג'אז", "CR-V", "אקורד", "HR-V"] },
  { slug: "suzuki", nameHe: "סוזוקי", nameEn: "Suzuki", description: "ויטארה, בלנו, סוויפט, SX4, אס-קרוס ועוד", popularModels: ["ויטארה", "בלנו", "סוויפט", "SX4", "אס-קרוס"] },
  { slug: "toyota", nameHe: "טויוטה", nameEn: "Toyota", description: "קורולה, יאריס, C-HR, קאמרי, RAV4 ועוד", popularModels: ["קורולה", "יאריס", "C-HR", "קאמרי", "RAV4"] },
  { slug: "nissan", nameHe: "ניסן", nameEn: "Nissan", description: "קשקאי, ג'וק, מיקרה, סנטרה, X-Trail ועוד", popularModels: ["קשקאי", "ג'וק", "מיקרה", "סנטרה", "X-Trail"] },
  { slug: "kia", nameHe: "קיה", nameEn: "Kia", description: "ספורטאג', פיקנטו, סיד, ניירו, סורנטו ועוד", popularModels: ["ספורטאג'", "פיקנטו", "סיד", "ניירו", "סורנטו"] },
  { slug: "audi", nameHe: "אאודי", nameEn: "Audi", description: "A3, A4, A5, Q3, Q5, Q7 ועוד", popularModels: ["A3", "A4", "A5", "Q3", "Q5"] },
  { slug: "volvo", nameHe: "וולבו", nameEn: "Volvo", description: "XC40, XC60, XC90, V40, S60 ועוד", popularModels: ["XC40", "XC60", "XC90", "V40", "S60"] },
  { slug: "mercedes", nameHe: "מרצדס", nameEn: "Mercedes", description: "C-Class, E-Class, GLA, GLC, A-Class ועוד", popularModels: ["C-Class", "E-Class", "GLA", "GLC", "A-Class"] },
  { slug: "skoda", nameHe: "סקודה", nameEn: "Skoda", description: "אוקטביה, פאביה, קארוק, קודיאק, סקאלה ועוד", popularModels: ["אוקטביה", "פאביה", "קארוק", "קודיאק", "סקאלה"] },
  { slug: "volkswagen", nameHe: "פולקסווגן", nameEn: "Volkswagen", description: "גולף, פולו, טיגואן, T-Cross, טוארג ועוד", popularModels: ["גולף", "פולו", "טיגואן", "T-Cross", "טוארג"] },
  { slug: "bmw", nameHe: "במו", nameEn: "BMW", description: "סדרה 3, סדרה 1, X1, X3, X5 ועוד", popularModels: ["סדרה 3", "סדרה 1", "X1", "X3", "X5"] },
  { slug: "hyundai", nameHe: "יונדאי", nameEn: "Hyundai", description: "טוסון, i20, i30, קונה, סנטה פה ועוד", popularModels: ["טוסון", "i20", "i30", "קונה", "סנטה פה"] },
  { slug: "mazda", nameHe: "מאזדה", nameEn: "Mazda", description: "CX-5, מאזדה 3, CX-30, CX-3, מאזדה 2 ועוד", popularModels: ["CX-5", "מאזדה 3", "CX-30", "CX-3", "מאזדה 2"] },
  { slug: "seat", nameHe: "סיאט", nameEn: "SEAT", description: "איביזה, לאון, ארונה, אטקה ועוד", popularModels: ["איביזה", "לאון", "ארונה", "אטקה"] },
  { slug: "mitsubishi", nameHe: "מיצובישי", nameEn: "Mitsubishi", description: "אאוטלנדר, ASX, לנסר, אקליפס קרוס ועוד", popularModels: ["אאוטלנדר", "ASX", "לנסר", "אקליפס קרוס"] },
  { slug: "chevrolet", nameHe: "שברולט", nameEn: "Chevrolet", description: "ספארק, אוניקס, טראקס, קרוז ועוד", popularModels: ["ספארק", "אוניקס", "טראקס", "קרוז"] },
  { slug: "peugeot", nameHe: "פיג'ו", nameEn: "Peugeot", description: "208, 2008, 3008, 308 ועוד", popularModels: ["208", "2008", "3008", "308"] },
  { slug: "renault", nameHe: "רנו", nameEn: "Renault", description: "קליאו, קפצ'ור, קדג'אר, מגאן ועוד", popularModels: ["קליאו", "קפצ'ור", "קדג'אר", "מגאן"] },
  { slug: "citroen", nameHe: "סיטרואן", nameEn: "Citroen", description: "C3, C4, C3 Aircross, ברלינגו ועוד", popularModels: ["C3", "C4", "C3 Aircross", "ברלינגו"] },
  { slug: "ford", nameHe: "פורד", nameEn: "Ford", description: "פוקוס, פיאסטה, קוגה, פומה ועוד", popularModels: ["פוקוס", "פיאסטה", "קוגה", "פומה"] },
  { slug: "opel", nameHe: "אופל", nameEn: "Opel", description: "קורסה, אסטרה, קרוסלנד, מוקה ועוד", popularModels: ["קורסה", "אסטרה", "קרוסלנד", "מוקה"] },
  { slug: "jeep", nameHe: "ג'יפ", nameEn: "Jeep", description: "רנגייד, קומפאס, צ'רוקי, גרנד צ'רוקי ועוד", popularModels: ["רנגייד", "קומפאס", "צ'רוקי", "גרנד צ'רוקי"] },
  { slug: "land-rover", nameHe: "לנד רובר", nameEn: "Land Rover", description: "דיסקברי ספורט, ריינג' רובר, אוווק ועוד", popularModels: ["דיסקברי ספורט", "ריינג' רובר אוווק", "ריינג' רובר"] },
  { slug: "fiat", nameHe: "פיאט", nameEn: "Fiat", description: "500, פנדה, טיפו, 500X ועוד", popularModels: ["500", "פנדה", "טיפו", "500X"] },
  { slug: "subaru", nameHe: "סובארו", nameEn: "Subaru", description: "XV, אימפרזה, פורסטר, אאוטבק ועוד", popularModels: ["XV", "אימפרזה", "פורסטר", "אאוטבק"] },
  { slug: "daihatsu", nameHe: "דייהטסו", nameEn: "Daihatsu", description: "סיריון, טריוס ועוד", popularModels: ["סיריון", "טריוס"] },
  { slug: "lexus", nameHe: "לקסוס", nameEn: "Lexus", description: "NX, RX, IS, CT ועוד", popularModels: ["NX", "RX", "IS", "CT"] },
];

export function getManufacturerBySlug(slug: string): ManufacturerInfo | undefined {
  return MANUFACTURERS.find((m) => m.slug === slug);
}

export function getManufacturerByHebrew(nameHe: string): ManufacturerInfo | undefined {
  return MANUFACTURERS.find((m) => m.nameHe === nameHe);
}

export function getAllSlugs(): string[] {
  return MANUFACTURERS.map((m) => m.slug);
}
