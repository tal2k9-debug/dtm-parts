"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Badge from "@/components/ui/Badge";
import { formatPrice, getPositionLabel } from "@/lib/utils";
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
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
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
