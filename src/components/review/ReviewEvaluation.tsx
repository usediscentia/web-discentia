"use client";

import type { SRSCard } from "@/types/srs";
import type { ReviewRating } from "@/lib/sm2";

export type AIVerdict = "correct" | "partial" | "incorrect";

interface ReviewEvaluationProps {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null; // null = "I don't know" path
  explanation: string;
  onRate: (rating: ReviewRating) => void;
}

const VERDICT_CONFIG = {
  correct: { label: "Correct", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
  partial: { label: "Mostly correct", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700", border: "border-amber-100" },
  incorrect: { label: "Incorrect", dot: "bg-red-500", badge: "bg-red-50 text-red-700", border: "border-red-100" },
};

const RATINGS: { value: ReviewRating; label: string; sub: string; style: string }[] = [
  { value: "hard", label: "Hard", sub: "Review tomorrow", style: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" },
  { value: "good", label: "Good", sub: "Review in ~3 days", style: "border-[#1A7A6D] bg-[#E6F5F3] text-[#1A7A6D] hover:bg-[#D0EDE9] ring-2 ring-[#1A7A6D]/20" },
  { value: "easy", label: "Easy", sub: "Review in ~7 days", style: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
];

export function ReviewEvaluation({ card, userAnswer, verdict, explanation, onRate }: ReviewEvaluationProps) {
  const cfg = verdict ? VERDICT_CONFIG[verdict] : null;

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl">
      {/* Card with answer comparison */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {/* Question */}
        <div className="px-7 pt-6 pb-4 border-b border-[#F3F4F6]">
          <p className="text-base font-semibold text-[#111]">{card.front}</p>
        </div>

        {/* Side-by-side answers */}
        <div className="grid grid-cols-2 divide-x divide-[#F3F4F6] px-0">
          <div className="px-6 py-4 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Your answer</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              {userAnswer || <span className="italic text-[#D1D5DB]">No answer given</span>}
            </p>
          </div>
          <div className="px-6 py-4 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-[#1A7A6D] uppercase tracking-wide">Correct answer</p>
            <p className="text-sm text-[#374151] leading-relaxed">{card.back}</p>
          </div>
        </div>

        {/* AI verdict bar */}
        {cfg && (
          <div className={`flex items-center gap-3 px-6 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6]`}>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {explanation && (
              <p className="text-xs text-[#6B7280] flex-1">{explanation}</p>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-[#6B7280]">How well did you recall this?</p>
        <div className="grid grid-cols-3 gap-3">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => onRate(r.value)}
              className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl border cursor-pointer transition-all ${r.style}`}
            >
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="text-[11px] opacity-70">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
