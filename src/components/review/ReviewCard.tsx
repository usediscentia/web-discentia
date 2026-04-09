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
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground">
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
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
          />
          <p className="text-[11px] text-[#D1D5DB]">⌘↵ to check</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDontKnow}
            className="px-4 py-2 text-xs font-medium text-[#9CA3AF] border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            I don&rsquo;t know
          </button>
          <div className="flex-1" />
          <button
            onClick={() => answer.trim() && onCheck(answer.trim())}
            disabled={!answer.trim()}
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answer →
          </button>
        </div>
      </div>
    </div>
  );
}
