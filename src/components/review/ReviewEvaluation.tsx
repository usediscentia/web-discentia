"use client";

import { BookOpen } from "lucide-react";
import type { SRSCard } from "@/types/srs";
import type { ReviewRating } from "@/lib/sm2";

export type AIVerdict = "correct" | "partial" | "incorrect";

interface ReviewEvaluationProps {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null; // null = "I don't know" path
  explanation: string;
  keyMissing?: string | null;
  sourceItemTitle?: string;
  onRate: (rating: ReviewRating) => void;
}

const VERDICT_CONFIG = {
  correct: { label: "Correct", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
  partial: { label: "Mostly correct", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700", border: "border-amber-100" },
  incorrect: { label: "Incorrect", dot: "bg-red-500", badge: "bg-red-50 text-red-700", border: "border-red-100" },
};

const RATINGS: { value: ReviewRating; label: string; sub: string; style: string }[] = [
  { value: "hard", label: "Hard", sub: "Review tomorrow", style: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" },
  { value: "good", label: "Good", sub: "Review in ~3 days", style: "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand-soft)] ring-2 ring-[var(--brand-ring)]" },
  { value: "easy", label: "Easy", sub: "Review in ~7 days", style: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
];

export function ReviewEvaluation({ card, userAnswer, verdict, explanation, keyMissing, sourceItemTitle, onRate }: ReviewEvaluationProps) {
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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand)]">Correct answer</p>
            <p className="text-sm text-[#374151] leading-relaxed">{card.back}</p>
          </div>
        </div>

        {/* AI verdict section */}
        {cfg && (
          <div className="border-t border-[#F3F4F6] bg-[#F9FAFB]">
            <div className="px-6 py-3 flex flex-col gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {explanation && (
                <p className="text-sm text-[#4B5563] leading-relaxed">{explanation}</p>
              )}
            </div>
            {keyMissing && verdict !== "correct" && (
              <div className={`mx-6 mb-3 px-3 py-2 rounded-lg border-l-2 ${
                verdict === "partial"
                  ? "border-l-amber-400 bg-amber-50/60"
                  : "border-l-red-400 bg-red-50/60"
              }`}>
                <p className={`text-xs font-medium ${
                  verdict === "partial" ? "text-amber-800" : "text-red-800"
                }`}>
                  What was missing
                </p>
                <p className={`text-xs mt-0.5 ${
                  verdict === "partial" ? "text-amber-700" : "text-red-700"
                }`}>
                  {keyMissing}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Source attribution */}
        {sourceItemTitle && (
          <div className="flex items-center gap-2 px-6 py-2.5 border-t border-[#F3F4F6] bg-[#FAFAFA]">
            <BookOpen size={12} className="text-[#9CA3AF] shrink-0" />
            <span className="text-[11px] text-[#9CA3AF]">
              From: <span className="font-medium text-[#6B7280]">{sourceItemTitle}</span>
            </span>
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
