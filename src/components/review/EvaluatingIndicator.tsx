"use client";

import { motion } from "motion/react";

interface EvaluatingIndicatorProps {
  accentColor: string;
}

export function EvaluatingIndicator({ accentColor }: EvaluatingIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="text-sm text-gray-400">Checking your answer…</p>
    </div>
  );
}
