"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import VehicleSelector from "./VehicleSelector";

export default function HeroSection() {
  return (
    <section className="relative min-h-[32vh] flex items-center gradient-hero overflow-hidden">
      {/* Warehouse background image */}
      <img
        src="/images/DTM.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-soft-light"
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4 w-full">
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
            </h1>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-3 max-w-lg">
              מעל 1,000 טמבונים משומשים מייבוא זמינים במלאי, לכל יצרני הרכב.
            </p>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-6 max-w-lg">
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

        {/* Google Review + Catalog Button — side by side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
        >
          {/* Catalog Button */}
          <Link href="/catalog">
            <button className="relative inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <span className="absolute -inset-1 bg-accent/40 rounded-2xl animate-ping opacity-30" />
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              צפו במלאי טמבונים
            </button>
          </Link>

          {/* Google Review */}
          <a
            href="https://www.google.co.il/search?q=%D7%93%D7%99%D7%98%D7%99%D7%90%D7%9D+%D7%A4%D7%A8%D7%98%D7%A1+%D7%97%D7%99%D7%A4%D7%94+%D7%91%D7%99%D7%A7%D7%95%D7%A8%D7%AA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-white rounded-2xl px-6 py-4 hover:bg-white transition-all group shadow-lg"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <span className="text-gray-800 font-bold text-sm">5.0</span>
            <span className="text-primary font-bold text-sm">דרגו אותנו!</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
