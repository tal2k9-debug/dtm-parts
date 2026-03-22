"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Badge from "@/components/ui/Badge";
import { formatPrice, getPositionLabel } from "@/lib/utils";
import { ADMIN_WHATSAPP_LINK } from "@/lib/constants";
import type { Bumper } from "@/types";

function getStatusBadgeVariant(status: string): "success" | "danger" | "warning" {
  switch (status) {
    case "במלאי":
    case "כן":
      return "success";
    case "אזל":
    case "לא":
      return "danger";
    case "בהזמנה":
      return "warning";
    default:
      return "danger";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "כן":
      return "במלאי";
    case "לא":
      return "אזל";
    default:
      return status;
  }
}

interface BumperCardProps {
  bumper: Bumper;
  isLoggedIn?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (bumperId: string) => void;
}

export default function BumperCard({ bumper, isLoggedIn, isFavorited, onToggleFavorite }: BumperCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/register");
      return;
    }

    onToggleFavorite?.(bumper.mondayItemId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/catalog/${bumper.id}`}>
        <div className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {bumper.imageUrl && !imgError ? (
              <img
                src={bumper.imageUrl}
                alt={bumper.name}
                className="absolute inset-0 w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={() => {
                  setImgError(true);
                }}
              />
            ) : (
              <img
                src="/images/bumper-placeholder.svg"
                alt="DTM Parts"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Status badge overlay */}
            <div className="absolute top-3 right-3">
              <Badge variant={getStatusBadgeVariant(bumper.status)} dot>
                {getStatusLabel(bumper.status)}
              </Badge>
            </div>
            {/* Favorite heart button */}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-sm"
              aria-label={isFavorited ? "הסר ממועדפים" : "הוסף למועדפים"}
            >
              {isFavorited ? (
                <HeartIconSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-500 hover:text-red-400 transition-colors" />
              )}
            </button>
            {/* WhatsApp buttons */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              {/* Send to DTM */}
              <a
                href={`${ADMIN_WHATSAPP_LINK}?text=${encodeURIComponent(`היי, אני מעוניין בטמבון מספר ${bumper.name}\n${bumper.carMake} ${bumper.carModel} ${bumper.carYear}\nhttps://dtmparts.co.il/catalog/${bumper.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#20bd5a] transition-colors duration-200 shadow-md"
                aria-label="שלח לנו בוואטסאפ"
                title="שלח לנו בוואטסאפ"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              {/* Share with friend */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`תראה את הטמבון הזה ב-DTM PARTS:\n${bumper.name} — ${bumper.carMake} ${bumper.carModel} ${bumper.carYear}\nhttps://dtmparts.co.il/catalog/${bumper.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-md"
                aria-label="שתף עם חבר"
                title="שתף עם חבר"
              >
                <svg className="w-4 h-4 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-12.814a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0 12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-bold text-text text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {bumper.name}
            </h3>
            <p className="text-text-secondary text-sm mb-3">
              {bumper.carMake} {bumper.carModel} {bumper.carYear}
              {bumper.position && ` | ${getPositionLabel(bumper.position)}`}
            </p>

            <div className="flex items-center justify-between">
              {bumper.price ? (
                <span className="text-xl font-extrabold text-primary">
                  {formatPrice(bumper.price)}
                </span>
              ) : (
                <span className="text-sm text-text-muted">צרו קשר למחיר</span>
              )}
              <span className="text-sm text-primary font-medium sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                לפרטים
                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
