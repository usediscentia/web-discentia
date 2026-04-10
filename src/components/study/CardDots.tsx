"use client";

import { motion } from "motion/react";

type AIVerdict = "correct" | "partial" | "incorrect";

interface CardResult {
  verdict: AIVerdict | null;
}

interface CardDotsProps {
  total: number;
  currentIndex: number;
  results: CardResult[];
}

function getDotColor(index: number, currentIndex: number, results: CardResult[]): string {
  if (index < results.length) {
    const verdict = results[index]?.verdict;
    if (verdict === "correct") return "bg-emerald-400";
    if (verdict === "partial") return "bg-amber-400";
    return "bg-red-400"; // incorrect or null (skipped)
  }
  if (index === currentIndex) return "bg-blue-400";
  return "bg-gray-200";
}

function getScale(index: number, currentIndex: number, results: CardResult[]): number {
  if (index === currentIndex && index >= results.length) return 1.3;
  return 1;
}

export function CardDots({ total, currentIndex, results }: CardDotsProps) {
  const displayCount = Math.min(total, 30);
  const dots = Array.from({ length: displayCount }, (_, i) => i);

  return (
    <div className="flex flex-wrap gap-1.5">
      {dots.map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${getDotColor(i, currentIndex, results)}`}
          initial={false}
          animate={{ scale: getScale(i, currentIndex, results) }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        />
      ))}
      {total > 30 && (
        <span className="text-[10px] text-gray-400 ml-1">+{total - 30}</span>
      )}
    </div>
  );
}
