"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import VehicleSelector from "./VehicleSelector";

export default function HeroSection() {
  return (
    <section className="relative min-h-[45vh] flex items-center gradient-hero overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
            >
              <span className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
              <span className="text-white/90 text-sm font-medium">
                מלאי מתעדכן בזמן אמת
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              הטמבון שאתם צריכים
              <br />
              <span className="text-primary-light">במחיר הנכון</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-6 max-w-lg">
              מגוון רחב של טמבונים, פגושים ומגנים במלאי, לכל יצרני הרכב.
              חפשו לפי רכב וקבלו הצעת מחיר תוך דקות.
            </p>

          </motion.div>

          {/* Vehicle Selector Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <VehicleSelector />
          </motion.div>
        </div>

        {/* Pulsing Catalog Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-6"
        >
          <Link href="/catalog">
            <button className="relative inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <span className="absolute -inset-1 bg-accent/40 rounded-2xl animate-ping opacity-30" />
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              צפו במלאי טמבונים / פגושים / מגנים
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
