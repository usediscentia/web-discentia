"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import type { SRSCard } from "@/types/srs";
import { RotateCcw, Check, Zap } from "lucide-react";

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

const RATINGS = [
  {
    value: "hard" as ReviewRating,
    label: "Hard",
    key: "1",
    Icon: RotateCcw,
    leftBorder: "border-l-rose-300",
    iconColor: "text-rose-400",
    labelColor: "text-rose-700",
    intervalColor: "text-rose-500",
    hoverBg: "hover:bg-rose-50/60",
  },
  {
    value: "good" as ReviewRating,
    label: "Good",
    key: "2",
    Icon: Check,
    leftBorder: "border-l-sky-300",
    iconColor: "text-sky-500",
    labelColor: "text-sky-700",
    intervalColor: "text-sky-600",
    hoverBg: "hover:bg-sky-50/60",
  },
  {
    value: "easy" as ReviewRating,
    label: "Easy",
    key: "3",
    Icon: Zap,
    leftBorder: "border-l-emerald-400",
    iconColor: "text-emerald-500",
    labelColor: "text-emerald-700",
    intervalColor: "text-emerald-600",
    hoverBg: "hover:bg-emerald-50/60",
  },
] as const;

export function RatingButtons({ card, onRate }: RatingButtonsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400/70">
        How well did you recall this?
      </p>
      <div className="flex flex-col gap-1.5">
        {RATINGS.map((r, i) => {
          const interval = getIntervalLabel(card, r.value);
          return (
            <motion.button
              key={r.value}
              onClick={() => onRate(r.value)}
              className={[
                "flex items-center justify-between px-4 py-3.5",
                "rounded-xl border border-gray-100 border-l-[3px] bg-white",
                "cursor-pointer",
                "transition-[background-color,box-shadow] duration-150 ease-out",
                "hover:border-gray-200 hover:shadow-sm",
                r.leftBorder,
                r.hoverBg,
              ].join(" ")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: 0.08 + i * 0.06,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Left: icon + label */}
              <div className="flex items-center gap-2.5">
                <r.Icon size={14} strokeWidth={2.5} className={r.iconColor} />
                <span className={`text-sm font-medium ${r.labelColor}`}>
                  {r.label}
                </span>
              </div>

              {/* Right: interval + kbd */}
              <div className="flex items-center gap-2.5">
                <span className={`text-sm font-semibold tabular-nums ${r.intervalColor}`}>
                  {interval}
                </span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-gray-200 text-[10px] text-gray-400 font-sans leading-none">
                  {r.key}
                </kbd>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
