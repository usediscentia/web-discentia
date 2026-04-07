"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  Check,
  X,
  ChevronRight,
  Trophy,
  RefreshCw,
} from "lucide-react";
import type { QuizData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface QuizMorphProps {
  exerciseId: string;
  title: string;
  data: QuizData;
  onComplete?: (result: ExerciseResult) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuizMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: QuizMorphProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(() => Date.now());

  const questions = data.questions;
  const total = questions.length;
  const current = questions[currentIndex];
  const isCorrect = selectedOption === current?.correctIndex;

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (answered) return;
      setSelectedOption(optionIndex);
      setAnswered(true);
      setResults((prev) => [
        ...prev,
        optionIndex === current.correctIndex,
      ]);
    },
    [answered, current]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= total) {
      const correct = [...results].filter(Boolean).length;
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
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  }, [currentIndex, total, results, exerciseId, startTime, onComplete]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setResults([]);
    setCompleted(false);
  }, []);

  const correct = results.filter(Boolean).length;
  const wrong = results.filter((r) => !r).length;
  const progress = ((currentIndex + (answered || completed ? 1 : 0)) / total) * 100;

  if (completed) {
    const score = Math.round((correct / total) * 100);
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
            Quiz Complete
          </h3>
          <p className="text-[#9CA3AF] text-sm mt-1">{title}</p>
        </div>

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
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100),
                }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#0a0a0a]">{score}%</span>
            </div>
          </div>

          {/* Per-question review */}
          <div className="flex items-center gap-1.5 mt-4">
            {results.map((wasCorrect, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  wasCorrect
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-3 text-sm">
            <span className="text-emerald-500 font-medium">{correct} correct</span>
            <span className="text-red-400 font-medium">{wrong} wrong</span>
          </div>

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

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">Quiz</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <span className="text-[12px] text-[#9CA3AF] tabular-nums font-medium">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0a0a0a] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4 w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-6"
        >
          <h3 className="text-[16px] font-semibold text-[#0a0a0a] tracking-[-0.2px] leading-[1.5]">
            {current?.question}
          </h3>

          <div className="flex flex-col gap-2 w-full">
            {current?.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === current.correctIndex;
              const showCorrect = answered && isCorrectOption;
              const showWrong = answered && isSelected && !isCorrectOption;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                  className={`flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    showCorrect
                      ? "bg-emerald-50 border-emerald-400"
                      : showWrong
                      ? "bg-red-50 border-red-300"
                      : isSelected && !answered
                      ? "bg-[#F3F4F6] border-[#D1D5DB]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
                  } ${answered && !isSelected && !isCorrectOption ? "opacity-50" : ""}`}
                  disabled={answered}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${
                        showCorrect
                          ? "bg-emerald-500 text-white"
                          : showWrong
                          ? "bg-red-400 text-white"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {OPTION_LABELS[idx]}
                    </span>
                    <span
                      className={`text-[14px] text-left ${
                        showCorrect
                          ? "font-semibold text-emerald-700"
                          : showWrong
                          ? "font-medium text-red-600"
                          : "text-[#1A1A1A]"
                      }`}
                    >
                      {option}
                    </span>
                  </div>
                  {showCorrect && (
                    <Check
                      size={16}
                      className="text-emerald-500 shrink-0"
                      strokeWidth={3}
                    />
                  )}
                  {showWrong && (
                    <X
                      size={16}
                      className="text-red-400 shrink-0"
                      strokeWidth={3}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation + Next */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl ${
                    isCorrect ? "bg-emerald-50" : "bg-amber-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCorrect ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  >
                    {isCorrect ? (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    ) : (
                      <X size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-semibold ${
                        isCorrect ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {isCorrect ? "Correct!" : "Not quite"}
                    </p>
                    {current.explanation && (
                      <p className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">
                        {current.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 mt-3 ml-auto px-4 py-2 rounded-xl bg-[#0a0a0a] text-white text-[13px] font-medium cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                >
                  {currentIndex + 1 >= total ? "See Results" : "Next Question"}
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
