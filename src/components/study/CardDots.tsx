"use client";

import { motion } from "motion/react";

type DotState = "done" | "current" | "todo";

interface CardDotsProps {
  total: number;
  currentIndex: number;
  completedCount: number;
}

function getDotState(index: number, currentIndex: number, completedCount: number): DotState {
  if (index < completedCount) return "done";
  if (index === currentIndex) return "current";
  return "todo";
}

const dotStyles: Record<DotState, string> = {
  done: "bg-emerald-400",
  current: "bg-amber-400",
  todo: "bg-gray-200",
};

export function CardDots({ total, currentIndex, completedCount }: CardDotsProps) {
  const displayCount = Math.min(total, 30);
  const dots = Array.from({ length: displayCount }, (_, i) => i);

  return (
    <div className="flex flex-wrap gap-1.5">
      {dots.map((i) => {
        const state = getDotState(i, currentIndex, completedCount);
        return (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${dotStyles[state]}`}
            initial={false}
            animate={{ scale: state === "current" ? 1.3 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          />
        );
      })}
      {total > 30 && (
        <span className="text-[10px] text-gray-400 ml-1">+{total - 30}</span>
      )}
    </div>
  );
}
