"use client";

import { motion } from "motion/react";

type Confidence = "unsure" | "think-so" | "certain";

interface ConfidenceRatingProps {
  value: Confidence | null;
  onChange: (c: Confidence) => void;
}

const OPTIONS: { value: Confidence; label: string; emoji: string; activeClass: string }[] = [
  { value: "unsure",   label: "Not sure",  emoji: "🤔", activeClass: "border-red-300 bg-red-50 text-red-700" },
  { value: "think-so", label: "Think so",  emoji: "🙂", activeClass: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "certain",  label: "Certain",   emoji: "💪", activeClass: "border-emerald-300 bg-emerald-50 text-emerald-700" },
];

export function ConfidenceRating({ value, onChange }: ConfidenceRatingProps) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <p className="text-xs font-medium text-gray-400">How confident are you?</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors flex-1 justify-center ${
                isActive
                  ? opt.activeClass
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28, delay: i * 0.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
