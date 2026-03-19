"use client";

import { StarIcon } from "@heroicons/react/24/solid";

const GOOGLE_REVIEW_URL =
  "https://www.google.co.il/search?q=%D7%93%D7%99%D7%98%D7%99%D7%90%D7%9D+%D7%A4%D7%A8%D7%98%D7%A1+%D7%97%D7%99%D7%A4%D7%94+%D7%91%D7%99%D7%A7%D7%95%D7%A8%D7%AA";

export default function GoogleReviewBanner() {
  return (
    <section className="py-6 bg-gradient-to-l from-blue-50 via-white to-blue-50 border-y border-blue-100">
      <div className="container mx-auto px-4">
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 group cursor-pointer"
        >
          {/* Google G Logo */}
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>

            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                  key={i}
                  className="w-6 h-6 text-yellow-400 group-hover:scale-125 transition-transform duration-300"
                  style={{ transitionDelay: `${i * 50}ms` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-gray-800">5.0</span>
              <span className="text-sm text-gray-500">(19 ביקורות)</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="bg-white border-2 border-blue-500 text-blue-600 px-6 py-2.5 rounded-full font-bold text-sm group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md flex items-center gap-2">
            <span>⭐</span>
            <span>דרגו אותנו בגוגל!</span>
            <svg
              className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </a>
      </div>
    </section>
  );
}
