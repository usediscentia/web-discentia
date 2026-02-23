"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, RotateCcw, X, Check, Trophy, RefreshCw } from "lucide-react";
import type { FlashcardData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface FlashcardMorphProps {
  exerciseId: string;
  title: string;
  data: FlashcardData;
  onComplete?: (result: ExerciseResult) => void;
}

export function FlashcardMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: FlashcardMorphProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const cards = data.cards;
  const total = cards.length;
  const current = cards[currentIndex];

  const handleAnswer = useCallback(
    (didKnow: boolean) => {
      const nextKnew = [...knew, didKnow];
      setKnew(nextKnew);
      setFlipped(false);

      if (currentIndex + 1 >= total) {
        // Completed all cards
        const correct = nextKnew.filter(Boolean).length;
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
      } else {
        // Small delay for card exit animation
        setTimeout(() => setCurrentIndex(currentIndex + 1), 80);
      }
    },
    [currentIndex, knew, total, exerciseId, startTime, onComplete]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnew([]);
    setCompleted(false);
  }, []);

  const correct = knew.filter(Boolean).length;
  const wrong = knew.filter((k) => !k).length;
  const progress = ((currentIndex + (completed ? 1 : 0)) / total) * 100;

  if (completed) {
    const score = Math.round((correct / total) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col w-full rounded-2xl border border-[#E5E7EB] overflow-hidden"
      >
        {/* Completion header */}
        <div className="bg-[#0a0a0a] px-6 py-5 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
          >
            <Trophy size={28} className="text-amber-400 mx-auto mb-2" />
          </motion.div>
          <h3 className="text-white text-lg font-semibold tracking-tight">
            Flashcards Complete
          </h3>
          <p className="text-[#9CA3AF] text-sm mt-1">{title}</p>
        </div>

        {/* Score ring */}
        <div className="flex flex-col items-center py-6 bg-white">
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
                stroke={score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 42 * (1 - score / 100),
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

          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#6B7280]">
                {correct} knew
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[#6B7280]">
                {wrong} missed
              </span>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-medium cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            <RefreshCw size={14} />
            Study Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Flashcards
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF]">
          {correct > 0 && (
            <span className="text-emerald-500 font-medium">{correct} correct</span>
          )}
          {wrong > 0 && (
            <span className="text-red-400 font-medium">{wrong} missed</span>
          )}
        </div>
      </div>

      {/* Card */}
      <motion.div
        className="relative flex flex-col items-center justify-center w-full min-h-[260px] bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-8 cursor-pointer select-none overflow-hidden"
        onClick={() => setFlipped(!flipped)}
        whileTap={{ scale: 0.985 }}
      >
        {/* Subtle corner accent */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#F3F4F6] to-transparent rounded-br-[40px]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${flipped ? "back" : "front"}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center gap-4 max-w-full"
          >
            {!flipped ? (
              <>
                <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#9CA3AF] mb-1">
                  Question {currentIndex + 1} of {total}
                </span>
                <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-[-0.3px] leading-[1.4] text-center">
                  {current?.front}
                </h2>
                {current?.hint && (
                  <p className="text-[12px] text-[#9CA3AF] italic">
                    Hint: {current.hint}
                  </p>
                )}
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-emerald-500 mb-1">
                  Answer
                </span>
                <p className="text-[15px] text-[#1A1A1A] text-center leading-relaxed">
                  {current?.back}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Flip hint */}
        <div className="absolute bottom-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9FAFB]">
          <RotateCcw size={12} className="text-[#9CA3AF]" />
          <span className="text-[11px] text-[#9CA3AF]">
            {flipped ? "Tap to see question" : "Tap to flip"}
          </span>
        </div>
      </motion.div>

      {/* Action buttons — only show when flipped */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between w-full"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(false);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#FECACA] cursor-pointer hover:bg-red-50 transition-colors"
            >
              <X size={14} className="text-[#EF4444]" />
              <span className="text-[13px] font-medium text-[#EF4444]">
                Didn&apos;t know
              </span>
            </button>

            <span className="text-[13px] font-semibold text-[#9CA3AF] tabular-nums">
              {currentIndex + 1} / {total}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#BBF7D0] cursor-pointer hover:bg-green-50 transition-colors"
            >
              <Check size={14} className="text-[#22C55E]" />
              <span className="text-[13px] font-medium text-[#22C55E]">
                Knew it
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0a0a0a] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
