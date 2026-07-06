"use client";

import { motion } from "motion/react";
import { Flame, Play } from "lucide-react";
import type { DeckWithCounts } from "@/services/storage";

// Same color scale as DifficultyBar (WeakSpotsWidget)
function weakColor(score: number): string {
  return score > 0.6 ? "#F87171" : "#FBBF24";
}

interface DeckCardProps {
  deck: DeckWithCounts;
  onOpen: () => void;
  onCram: () => void;
  onWeakestCram: () => void;
}

export function DeckCard({ deck, onOpen, onCram, onWeakestCram }: DeckCardProps) {
  const isWeak = deck.weakScore > 0.35;
  const isEmpty = deck.cardCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onOpen}
      className={`group flex flex-col gap-3 rounded-[12px] border border-[#E8E5E0] bg-white p-4 cursor-pointer transition-colors hover:border-[#D8D4CE] hover:bg-[#FAFAF8] ${
        isEmpty ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#1A1814] truncate">
          {deck.name}
        </span>
        {isWeak && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWeakestCram();
            }}
            title="Revisar pontos fracos deste deck"
            className="flex items-center gap-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{
              color: weakColor(deck.weakScore),
              background: `${weakColor(deck.weakScore)}1A`,
            }}
          >
            <Flame size={10} />
            {Math.round(deck.weakScore * 100)}%
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#9C9690]">
        <span>
          {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
        </span>
        {deck.dueCount > 0 && (
          <span className="font-medium text-emerald-600">
            {deck.dueCount} {deck.dueCount === 1 ? "pendente" : "pendentes"}
          </span>
        )}
        {!isEmpty && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCram();
            }}
            className="ml-auto flex items-center gap-1 text-[#C8C4BE] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover:text-[#6B6560]"
          >
            <Play size={10} />
            Estudar
          </button>
        )}
      </div>
    </motion.div>
  );
}
