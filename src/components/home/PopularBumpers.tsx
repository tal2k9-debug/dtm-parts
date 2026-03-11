"use client";

import { motion } from "framer-motion";
import BumperCard from "@/components/catalog/BumperCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import type { Bumper } from "@/types";

// Mock data — will be replaced with real BumperCache data
const MOCK_BUMPERS: Bumper[] = [
  {
    id: "1",
    mondayItemId: "001",
    name: "פגוש קדמי יונדאי i20",
    carMake: "יונדאי",
    carModel: "i20",
    carYear: "2021",
    position: "FRONT",
    price: 850,
    status: "במלאי",
    imageUrl: null,
    lastSynced: new Date(),
  },
  {
    id: "2",
    mondayItemId: "002",
    name: "פגוש אחורי קיה ספורטאז'",
    carMake: "קיה",
    carModel: "ספורטאז'",
    carYear: "2022",
    position: "REAR",
    price: 1200,
    status: "במלאי",
    imageUrl: null,
    lastSynced: new Date(),
  },
  {
    id: "3",
    mondayItemId: "003",
    name: "פגוש קדמי טויוטה קורולה",
    carMake: "טויוטה",
    carModel: "קורולה",
    carYear: "2023",
    position: "FRONT",
    price: 950,
    status: "בהזמנה",
    imageUrl: null,
    lastSynced: new Date(),
  },
  {
    id: "4",
    mondayItemId: "004",
    name: "פגוש קדמי מזדה CX-5",
    carMake: "מזדה",
    carModel: "CX-5",
    carYear: "2020",
    position: "FRONT",
    price: 1100,
    status: "במלאי",
    imageUrl: null,
    lastSynced: new Date(),
  },
  {
    id: "5",
    mondayItemId: "005",
    name: "פגוש אחורי ניסאן קשקאי",
    carMake: "ניסאן",
    carModel: "קשקאי",
    carYear: "2022",
    position: "REAR",
    price: null,
    status: "אזל",
    imageUrl: null,
    lastSynced: new Date(),
  },
  {
    id: "6",
    mondayItemId: "006",
    name: "פגוש קדמי פולקסווגן גולף",
    carMake: "פולקסווגן",
    carModel: "גולף",
    carYear: "2021",
    position: "FRONT",
    price: 1350,
    status: "במלאי",
    imageUrl: null,
    lastSynced: new Date(),
  },
];

export default function PopularBumpers() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-2">
              טמבונים פופולריים
            </h2>
            <p className="text-text-secondary text-lg">
              הפריטים הנמכרים ביותר שלנו
            </p>
          </div>
          <Link href="/catalog" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              לקטלוג המלא
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_BUMPERS.map((bumper) => (
            <BumperCard key={bumper.id} bumper={bumper} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/catalog">
            <Button variant="secondary" fullWidth>
              לקטלוג המלא
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
