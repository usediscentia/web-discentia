"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TextCursorInput,
  Trophy,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import type { FillGapData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface FillGapMorphProps {
  exerciseId: string;
  title: string;
  data: FillGapData;
  onComplete?: (result: ExerciseResult) => void;
}

export function FillGapMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: FillGapMorphProps) {
  const [filledGaps, setFilledGaps] = useState<Record<string, string>>({});
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  // Parse passage into segments: text parts and gap markers
  const segments = useMemo(() => {
    const result: Array<{ type: "text"; content: string } | { type: "gap"; gapId: string }> = [];
    const regex = /\{\{(\w+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(data.passage)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          content: data.passage.slice(lastIndex, match.index),
        });
      }
      result.push({ type: "gap", gapId: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < data.passage.length) {
      result.push({
        type: "text",
        content: data.passage.slice(lastIndex),
      });
    }

    return result;
  }, [data.passage]);

  const gapMap = useMemo(() => {
    const map = new Map<string, (typeof data.gaps)[number]>();
    for (const gap of data.gaps) {
      map.set(gap.id, gap);
    }
    return map;
  }, [data.gaps]);

  const usedWords = useMemo(
    () => new Set(Object.values(filledGaps)),
    [filledGaps]
  );

  const allGapsFilled = data.gaps.every((g) => filledGaps[g.id]);

  const gapResults = useMemo(() => {
    if (!checked) return new Map<string, boolean>();
    const results = new Map<string, boolean>();
    for (const gap of data.gaps) {
      results.set(
        gap.id,
        filledGaps[gap.id]?.toLowerCase().trim() ===
          gap.answer.toLowerCase().trim()
      );
    }
    return results;
  }, [checked, data.gaps, filledGaps]);

  const handleGapClick = useCallback(
    (gapId: string) => {
      if (checked) return;
      if (filledGaps[gapId]) {
        // Remove word from gap, return to bank
        setFilledGaps((prev) => {
          const next = { ...prev };
          delete next[gapId];
          return next;
        });
        setActiveGapId(gapId);
      } else {
        setActiveGapId((prev) => (prev === gapId ? null : gapId));
      }
    },
    [checked, filledGaps]
  );

  const handleWordClick = useCallback(
    (word: string) => {
      if (checked || !activeGapId) return;
      setFilledGaps((prev) => ({ ...prev, [activeGapId]: word }));

      // Auto-advance to next empty gap
      const nextEmpty = data.gaps.find(
        (g) => g.id !== activeGapId && !filledGaps[g.id]
      );
      setActiveGapId(nextEmpty?.id ?? null);
    },
    [checked, activeGapId, data.gaps, filledGaps]
  );

  const handleCheck = useCallback(() => {
    setChecked(true);
    setActiveGapId(null);

    const correct = data.gaps.filter(
      (g) =>
        filledGaps[g.id]?.toLowerCase().trim() ===
        g.answer.toLowerCase().trim()
    ).length;
    const total = data.gaps.length;

    setCompleted(true);
    onComplete?.({
      id: nanoid(),
      exerciseId,
      score: Math.round((correct / total) * 100),
      details: {
        total,
        correct,
        wrong: total - correct,
        skipped: 0,
      },
      duration: Date.now() - startTime,
      completedAt: Date.now(),
    });
  }, [data.gaps, filledGaps, exerciseId, startTime, onComplete]);

  const handleRestart = useCallback(() => {
    setFilledGaps({});
    setActiveGapId(null);
    setChecked(false);
    setCompleted(false);
  }, []);

  const correct = checked
    ? [...gapResults.values()].filter(Boolean).length
    : 0;
  const wrong = checked ? data.gaps.length - correct : 0;
  const score = checked
    ? Math.round((correct / data.gaps.length) * 100)
    : 0;

  // --- COMPLETION SCREEN ---
  if (completed && checked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col w-full rounded-2xl border border-[#E5E7EB] overflow-hidden"
      >
        <div className="bg-[#0a0a0a] px-6 py-5 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
          >
            <Trophy size={28} className="text-amber-400 mx-auto mb-2" />
          </motion.div>
          <h3 className="text-white text-lg font-semibold tracking-tight">
            Fill the Gap Complete
          </h3>
          <p className="text-[#9CA3AF] text-sm mt-1">{title}</p>
        </div>

        <div className="flex flex-col items-center py-6 bg-white">
          {/* Score ring */}
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={
                  score >= 70
                    ? "#22C55E"
                    : score >= 40
                    ? "#F59E0B"
                    : "#EF4444"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100),
                }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#0a0a0a]">
                {score}%
              </span>
            </div>
          </div>

          {/* Per-gap review dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {data.gaps.map((gap, i) => (
              <motion.div
                key={gap.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  gapResults.get(gap.id)
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-3 text-sm">
            <span className="text-emerald-500 font-medium">
              {correct} correct
            </span>
            <span className="text-red-400 font-medium">{wrong} wrong</span>
          </div>

          {/* Show corrections for wrong gaps */}
          {wrong > 0 && (
            <div className="flex flex-col gap-1.5 mt-4 px-6 w-full">
              {data.gaps
                .filter((g) => !gapResults.get(g.id))
                .map((gap) => (
                  <div
                    key={gap.id}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <X size={12} className="text-red-400 shrink-0" />
                    <span className="text-red-400 line-through">
                      {filledGaps[gap.id]}
                    </span>
                    <span className="text-[#9CA3AF]">{"\u2192"}</span>
                    <span className="text-emerald-600 font-medium">
                      {gap.answer}
                    </span>
                  </div>
                ))}
            </div>
          )}

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-medium cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // --- PLAYING STATE ---
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TextCursorInput size={15} className="text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Fill the Gap
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <span className="text-[12px] text-[#9CA3AF] tabular-nums font-medium">
          {Object.keys(filledGaps).length} / {data.gaps.length}
        </span>
      </div>

      {/* Passage with inline gaps */}
      <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-6">
        <div className="text-[15px] leading-[2] text-[#1A1A1A]">
          {segments.map((seg, i) => {
            if (seg.type === "text") {
              return <span key={i}>{seg.content}</span>;
            }

            const gap = gapMap.get(seg.gapId);
            if (!gap) return null;

            const filled = filledGaps[gap.id];
            const isActive = activeGapId === gap.id;
            const isCorrect = checked && gapResults.get(gap.id);
            const isWrong = checked && !gapResults.get(gap.id);

            return (
              <motion.button
                key={gap.id}
                onClick={() => handleGapClick(gap.id)}
                animate={
                  isWrong ? { x: [0, -3, 3, -3, 3, 0] } : {}
                }
                transition={{ duration: 0.3 }}
                className={`inline-flex items-center justify-center min-w-[80px] px-2 py-0.5 mx-0.5 rounded border-b-2 transition-all cursor-pointer align-baseline ${
                  isCorrect
                    ? "bg-emerald-50 border-emerald-400"
                    : isWrong
                    ? "bg-red-50 border-red-300"
                    : isActive
                    ? "bg-[#F3F4F6] border-[#0a0a0a]"
                    : filled
                    ? "bg-[#F3F4F6] border-[#D1D5DB]"
                    : "bg-[#F9FAFB] border-[#D1D5DB] border-dashed"
                }`}
              >
                {filled ? (
                  <span
                    className={`text-[14px] font-medium ${
                      isCorrect
                        ? "text-emerald-700"
                        : isWrong
                        ? "text-red-600"
                        : "text-[#1A1A1A]"
                    }`}
                  >
                    {filled}
                    {isCorrect && (
                      <Check
                        size={12}
                        className="inline ml-1 text-emerald-500"
                        strokeWidth={3}
                      />
                    )}
                    {isWrong && (
                      <X
                        size={12}
                        className="inline ml-1 text-red-400"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                ) : (
                  <span className="text-[14px] text-[#C0C0C0]">
                    _____
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Word bank */}
      {!checked && (
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wide">
            Word Bank
          </span>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {data.wordBank.map((word) => {
                const isUsed = usedWords.has(word);
                return (
                  <motion.button
                    key={word}
                    layout
                    onClick={() => handleWordClick(word)}
                    whileTap={!isUsed ? { scale: 0.95 } : {}}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all cursor-pointer ${
                      isUsed
                        ? "opacity-30 pointer-events-none border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]"
                        : activeGapId
                        ? "border-[#D1D5DB] bg-white text-[#1A1A1A] hover:bg-[#F3F4F6] hover:border-[#0a0a0a]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]"
                    }`}
                  >
                    {word}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Check / correction info */}
      {checked && (
        <div className="flex flex-col gap-2">
          {data.gaps
            .filter((g) => !gapResults.get(g.id))
            .map((gap) => (
              <div
                key={gap.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-[13px]"
              >
                <X size={12} className="text-red-400 shrink-0" />
                <span className="text-red-500">
                  &quot;{filledGaps[gap.id]}&quot;
                </span>
                <span className="text-[#9CA3AF]">{"\u2192"} correct:</span>
                <span className="text-emerald-600 font-medium">
                  {gap.answer}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end">
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={!allGapsFilled}
            className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
              allGapsFilled
                ? "bg-[#1A1A1A] text-white hover:bg-[#333]"
                : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            }`}
          >
            Check Answers
          </button>
        ) : (
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-medium cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
