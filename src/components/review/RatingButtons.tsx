"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import type { SRSCard } from "@/types/srs";

interface RatingButtonsProps {
  card: SRSCard;
  onRate: (rating: ReviewRating) => void;
}

function getIntervalLabel(card: SRSCard, rating: ReviewRating): string {
  const updated = sm2(card, rating);
  const days = updated.interval;
  if (days <= 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;
}

const RATINGS: { value: ReviewRating; label: string; key: string; className: string }[] = [
  {
    value: "hard",
    label: "Hard",
    key: "1",
    className:
      "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
  },
  {
    value: "good",
    label: "Good",
    key: "2",
    className:
      "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700",
  },
  {
    value: "easy",
    label: "Easy",
    key: "3",
    className:
      "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700",
  },
];

export function RatingButtons({ card, onRate }: RatingButtonsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") onRate("hard");
      if (e.key === "2") onRate("good");
      if (e.key === "3") onRate("easy");
      if (e.key === " ") {
        e.preventDefault();
        onRate("good");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate]);

  return (
    <div className="flex flex-col gap-2 mt-5">
      <p className="text-xs font-medium text-gray-400">How well did you recall this?</p>
      <div className="grid grid-cols-3 gap-3">
        {RATINGS.map((r, i) => (
          <motion.button
            key={r.value}
            onClick={() => onRate(r.value)}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl border cursor-pointer transition-colors ${r.className}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              delay: 0.15 + i * 0.05,
            }}
            whileHover={{ y: -2, boxShadow: "0 4px 10px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-sm font-semibold">{r.label}</span>
            <span className="text-xs opacity-60 leading-snug">
              {getIntervalLabel(card, r.value)}
            </span>
            <kbd className="text-[10px] opacity-35 font-sans mt-0.5">[{r.key}]</kbd>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
