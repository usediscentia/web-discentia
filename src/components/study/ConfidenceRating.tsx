"use client";

import { motion } from "motion/react";
import { Meh, ThumbsUp, BadgeCheck, type LucideIcon } from "lucide-react";

type Confidence = "unsure" | "think-so" | "certain";

interface ConfidenceRatingProps {
  value: Confidence | null;
  onChange: (c: Confidence) => void;
}

const OPTIONS: {
  value: Confidence;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
  hoverClass: string;
}[] = [
  {
    value: "unsure",
    label: "Not sure",
    Icon: Meh,
    activeClass: "bg-rose-500 border-rose-500 text-white",
    hoverClass: "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600",
  },
  {
    value: "think-so",
    label: "Think so",
    Icon: ThumbsUp,
    activeClass: "bg-amber-400 border-amber-400 text-white",
    hoverClass: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600",
  },
  {
    value: "certain",
    label: "Certain",
    Icon: BadgeCheck,
    activeClass: "bg-emerald-500 border-emerald-500 text-white",
    hoverClass: "hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600",
  },
];

export function ConfidenceRating({ value, onChange }: ConfidenceRatingProps) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400/80">
        How confident are you?
      </p>
      <div className="flex gap-2">
        {OPTIONS.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={[
                "flex items-center gap-1.5 px-3 py-2.5 rounded-xl border",
                "text-xs font-medium cursor-pointer flex-1 justify-center",
                "transition-[background-color,border-color,color] duration-150 ease-out",
                isActive
                  ? opt.activeClass
                  : `bg-white border-gray-200 text-gray-500 ${opt.hoverClass}`,
              ].join(" ")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                ease: [0.23, 1, 0.32, 1],
                delay: i * 0.05,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <opt.Icon size={13} strokeWidth={2.5} />
              <span>{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
