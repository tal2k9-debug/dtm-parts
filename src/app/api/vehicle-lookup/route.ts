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
  "SKODA AUTO": "סקודה",
  "CITROEN/PEUGEOT": "סיטרואן",
  "SSANGYONG": "סאן יאנג",
  "CHANGAN": "צ'אנגאן",
  "BYD": "BYD",
  "GREAT WALL": "גרייט וול",
  "GAC": "גאקו",
};

// Map raw make names that include origin country
function normalizeMake(rawMake: string): string {
  // Remove country suffixes like "טסלה סין", "יונדאי קוריאה", "מזדה יפן"
  const cleaned = rawMake
    .replace(/\s*(סין|קוריאה|יפן|גרמניה|צרפת|איטליה|ספרד|שוודיה|אנגליה|צ\'כיה|רומניה|הודו|ארה"ב|ארהב|USA|CHINA|JAPAN|KOREA|GERMANY|FRANCE|ITALY|SPAIN|SWEDEN|UK|CZECH|ROMANIA|INDIA)\s*$/i, "")
    .trim()
    .toUpperCase();
  return MAKE_MAP[cleaned] || MAKE_MAP[rawMake.trim().toUpperCase()] || cleaned;
}

// Map English model names to Hebrew equivalents used in our inventory
const MODEL_MAP: Record<string, string> = {
  "MODEL 3": "מודל 3",
  "MODEL Y": "מודל Y",
  "MODEL S": "מודל S",
  "MODEL X": "מודל X",
  "COROLLA": "קורולה",
  "YARIS": "יאריס",
  "YARIS CROSS": "יאריס קרוס",
  "C-HR": "CHR",
  "CHR": "CHR",
  "RAV4": "ראב 4",
  "RAV 4": "ראב 4",
  "LAND CRUISER": "לנד קרוזר",
  "CAMRY": "קאמרי",
  "AURIS": "אוריס",
  "AYGO": "אייגו",
  "AYGO X": "אייגו X",
  "HILUX": "היילקס",
  "PRIUS": "פריוס",
  "I10": "I10",
  "I20": "I20",
  "I25": "I25",
  "I30": "I30",
  "TUCSON": "טוסון",
  "KONA": "קונה",
  "IONIQ": "איוניק",
  "IONIQ 5": "איוניק 5",
  "SANTA FE": "סנטה פה",
  "SONATA": "סונטה",
  "PICANTO": "פיקנטו",
  "RIO": "ריו",
  "SPORTAGE": "ספורטאז",
  "NIRO": "נירו",
  "STONIC": "סטוניק",
  "CEED": "סיד",
  "SORENTO": "סורנטו",
  "CARNIVAL": "קארניבל",
  "OPTIMA": "אופטימה",
  "XCEED": "אקסיד",
  "SELTOS": "סלטוס",
  "QASHQAI": "קשקאי",
  "JUKE": "גוק",
  "MICRA": "מיקרה",
  "X-TRAIL": "אקסטרייל",
  "LEAF": "ליף",
  "NAVARA": "נאברה",
  "NOTE": "נוט",
  "GOLF": "גולף",
  "POLO": "פולו",
  "TIGUAN": "טיגואן",
  "TOUAREG": "טוארג",
  "PASSAT": "פאסאט",
  "CADDY": "קאדי",
  "T-CROSS": "T CROSS טיקרוס",
  "ID.3": "ID3",
  "OCTAVIA": "אוקטביה",
  "FABIA": "פאביה",
  "SUPERB": "סופרב",
  "KAROQ": "קארוק",
  "KAMIQ": "קאמיק",
  "KODIAQ": "קודיאק",
  "SCALA": "סקאלה",
  "ENYAQ": "אניאק",
  "IBIZA": "איביזה",
  "LEON": "לאון",
  "ARONA": "ארונה",
  "ATECA": "אטקה",
  "CIVIC": "סיוויק",
  "JAZZ": "גאז",
  "CRV": "CRV",
  "CR-V": "CRV",
  "HRV": "HRV",
  "HR-V": "HRV",
  "FIT": "גאז",
  "MAZDA2": "2",
  "MAZDA3": "3",
  "MAZDA 2": "2",
  "MAZDA 3": "3",
  "MAZDA 6": "6",
  "CX-3": "CX3",
  "CX-30": "CX30",
  "CX-5": "CX5",
  "MX-5": "MX5",
  "SWIFT": "סוויפט",
  "VITARA": "ויטארה",
  "JIMNY": "גימני",
  "IGNIS": "איגניס",
  "BALENO": "בלנו",
  "SX4": "SX4",
  "CLIO": "קליאו",
  "CAPTUR": "קפצור",
  "KOLEOS": "קולאוס",
  "MEGANE": "מגאן",
  "ARKANA": "ארקנה",
  "ZOE": "זואי",
  "208": "208",
  "2008": "2008",
  "3008": "3008",
  "308": "308",
  "5008": "5008",
  "C3": "C3",
  "C4": "C4",
  "BERLINGO": "ברלינגו",
  "CORSA": "קורסה",
  "ASTRA": "אסטרה",
  "CROSSLAND": "קרוסלנד",
  "MOKKA": "מוקה",
  "GRANDLAND": "גרנדלנד",
  "DUSTER": "דאסטר",
  "SANDERO": "סנדרו",
  "OUTLANDER": "אוטלנדר",
  "ASX": "ASX",
  "ECLIPSE CROSS": "אקליפס קרוס",
  "SPACE STAR": "ספייס סטאר",
  "COMPASS": "קומפאס",
  "RENEGADE": "רנגייד",
  "500": "500",
  "TIPO": "טיפו",
  "PANDA": "פנדה",
  "FOCUS": "פוקוס",
  "FIESTA": "פיאסטה",
  "PUMA": "פומה",
  "MUSTANG": "מוסטנג",
  "XV": "XV",
  "FORESTER": "פורסטר",
  "OUTBACK": "אווטבק",
  "XC40": "XC40",
  "XC60": "XC60",
  "XC90": "XC90",
  "V40": "V40",
  "V60": "V60",
  "S60": "S60",
  "S90": "S90",
  "EX30": "EX30",
  "A CLASS": "A CLASS",
  "C CLASS": "C CLASS",
  "E CLASS": "E CLASS",
  "S CLASS": "S CLASS",
  "GLA": "GLA",
  "GLC": "GLC",
  "GLE": "GLE",
  "A3": "A3",
  "A4": "A4",
  "A6": "A6",
  "Q3": "Q3",
  "Q5": "Q5",
  "E-TRON": "E TRON",
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

    const rawMake = (record.tozeret_nm || record.tozar || "").trim();
    const rawModel = (record.kinuy_mishari || record.degem_nm || "").trim();
    const year = parseInt(record.shnat_yitzur) || null;
    const color = (record.tzeva_rechev || "").trim();

    // Map manufacturer to Hebrew name used in our system
    const hebrewMake = normalizeMake(rawMake);

    // Map model to Hebrew name used in our system
    const modelUpper = rawModel.toUpperCase().trim();
    const hebrewModel = MODEL_MAP[modelUpper] || rawModel;

    return NextResponse.json({
      plate: cleanPlate,
      make: hebrewMake,
      makeOriginal: rawMake,
      model: hebrewModel,
      modelOriginal: rawModel,
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
