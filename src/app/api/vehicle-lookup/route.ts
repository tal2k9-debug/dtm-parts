import { NextRequest, NextResponse } from "next/server";

// Israeli Ministry of Transport open data API
const GOV_API_URL = "https://data.gov.il/api/3/action/datastore_search";
const RESOURCE_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";

// Map common English manufacturer names to Hebrew
const MAKE_MAP: Record<string, string> = {
  "טויוטה": "טויוטה",
  "TOYOTA": "טויוטה",
  "HYUNDAI": "יונדאי",
  "הונדאי": "יונדאי",
  "KIA": "קיה",
  "MAZDA": "מאזדה",
  "HONDA": "הונדה",
  "NISSAN": "ניסן",
  "SUZUKI": "סוזוקי",
  "MITSUBISHI": "מיצובישי",
  "VOLKSWAGEN": "פולקסווגן",
  "SKODA": "סקודה",
  "SEAT": "סיאט",
  "MERCEDES": "מרצדס",
  "MERCEDES BENZ": "מרצדס",
  "MERCEDES-BENZ": "מרצדס",
  "BMW": "במו",
  "B.M.W": "במו",
  "B.M.W.": "במו",
  "AUDI": "אודי",
  "VOLVO": "וולבו",
  "PEUGEOT": "פיגו",
  "CITROEN": "סיטרואן",
  "RENAULT": "רנו",
  "FIAT": "פיאט",
  "FORD": "פורד",
  "OPEL": "אופל",
  "ALFA ROMEO": "אלפא",
  "JAGUAR": "יגואר",
  "LAND ROVER": "לנד רובר",
  "RANGE ROVER": "ריינג רובר",
  "LEXUS": "לקסוס",
  "SUBARU": "סובארו",
  "PORSCHE": "פורשה",
  "TESLA": "טסלה",
  "MINI": "מיני",
  "JEEP": "גיפ",
  "DACIA": "דאציה",
  "SMART": "סמארט",
  "ISUZU": "איסוזו",
  "MG": "mg",
  "CHEVROLET": "שברולט",
  "DODGE": "דודג'",
  "CHRYSLER": "קרייזלר",
  "FERRARI": "פרארי",
  "MASERATI": "מזארטי",
  "POLESTAR": "פולסטאר",
  "GEELY": "גילי",
  "CHERY": "צרי",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get("plate");

    if (!plate) {
      return NextResponse.json(
        { error: "חסר מספר רכב" },
        { status: 400 }
      );
    }

    // Clean plate number — remove dashes, spaces, non-digits
    const cleanPlate = plate.replace(/[^0-9]/g, "");

    if (cleanPlate.length < 5 || cleanPlate.length > 8) {
      return NextResponse.json(
        { error: "מספר רכב לא תקין (5-8 ספרות)" },
        { status: 400 }
      );
    }

    // Query Israeli government API
    const url = `${GOV_API_URL}?resource_id=${RESOURCE_ID}&q=${cleanPlate}&limit=5`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error("Gov API error:", response.status);
      return NextResponse.json(
        { error: "שגיאה בשירות משרד התחבורה. נסה שוב מאוחר יותר." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const records = data?.result?.records;

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "לא נמצא רכב עם מספר זה" },
        { status: 404 }
      );
    }

    // Find exact match by plate number
    const record = records.find(
      (r: Record<string, string>) =>
        r.mispar_rechev?.toString().replace(/[^0-9]/g, "") === cleanPlate
    ) || records[0];

    const rawMake = (record.tozeret_nm || record.tozar || "").trim().toUpperCase();
    const rawModel = (record.kinuy_mishari || record.degem_nm || "").trim();
    const year = parseInt(record.shnat_yitzur) || null;
    const color = (record.tzeva_rechev || "").trim();

    // Map manufacturer to Hebrew name used in our system
    const hebrewMake = MAKE_MAP[rawMake] || rawMake;

    return NextResponse.json({
      plate: cleanPlate,
      make: hebrewMake,
      makeOriginal: rawMake,
      model: rawModel,
      year,
      color,
    });
  } catch (error) {
    console.error("Vehicle lookup error:", error);
    return NextResponse.json(
      { error: "שגיאה בחיפוש. נסה שוב." },
      { status: 500 }
    );
  }
}
