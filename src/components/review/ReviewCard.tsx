"use client";

import { useState } from "react";
import type { SRSCard } from "@/types/srs";

interface ReviewCardProps {
  card: SRSCard;
  index: number;
  total: number;
  onCheck: (userAnswer: string) => void;
  onDontKnow: () => void;
}

export function ReviewCard({ card, index, total, onCheck, onDontKnow }: ReviewCardProps) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl">
      {/* Source label */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#1A7A6D]" />
        <span className="text-xs text-[#9CA3AF] font-medium">
          Card {index + 1} of {total}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 flex flex-col gap-5">
        <p className="text-lg font-semibold text-[#111] leading-snug">{card.front}</p>

        {/* Answer area */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#6B7280]">Your answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && answer.trim()) {
                onCheck(answer.trim());
              }
            }}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full text-sm text-[#111] bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A7A6D]/30 focus:border-[#1A7A6D] placeholder:text-[#D1D5DB]"
          />
          <p className="text-[11px] text-[#D1D5DB]">⌘↵ to check</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDontKnow}
            className="px-4 py-2 text-xs font-medium text-[#9CA3AF] border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            I don't know
          </button>
          <div className="flex-1" />
          <button
            onClick={() => answer.trim() && onCheck(answer.trim())}
            disabled={!answer.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1A7A6D] rounded-lg cursor-pointer hover:bg-[#15665B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check answer →
          </button>
        </div>
      </div>
    </div>
  );
}
