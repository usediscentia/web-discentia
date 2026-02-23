"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Check,
  X,
  Trophy,
  RefreshCw,
  Timer,
} from "lucide-react";
import type { SprintData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface SprintMorphProps {
  exerciseId: string;
  title: string;
  data: SprintData;
  onComplete?: (result: ExerciseResult) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function SprintMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: SprintMorphProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<("correct" | "wrong" | "timeout")[]>(
    []
  );
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(data.timePerQuestion);
  const [startTime, setStartTime] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = data.questions;
  const total = questions.length;
  const current = questions[currentIndex];

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => clearTimers, [clearTimers]);

  const finishExercise = useCallback(
    (finalResults: ("correct" | "wrong" | "timeout")[]) => {
      clearTimers();
      setPhase("done");
      const correct = finalResults.filter((r) => r === "correct").length;
      onComplete?.({
        id: nanoid(),
        exerciseId,
        score: Math.round((correct / total) * 100),
        details: {
          total,
          correct,
          wrong: finalResults.filter((r) => r === "wrong").length,
          skipped: finalResults.filter((r) => r === "timeout").length,
        },
        duration: Date.now() - startTime,
        completedAt: Date.now(),
      });
    },
    [clearTimers, exerciseId, total, startTime, onComplete]
  );

  const advanceToNext = useCallback(
    (nextResults: ("correct" | "wrong" | "timeout")[]) => {
      if (currentIndex + 1 >= total) {
        finishExercise(nextResults);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setTimeLeft(data.timePerQuestion);
      }
    },
    [currentIndex, total, data.timePerQuestion, finishExercise]
  );

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== null) return; // already answered
      clearTimers();
      setSelectedOption(optionIndex);

      const isCorrect = optionIndex === current.correctIndex;
      const outcome: "correct" | "wrong" = isCorrect ? "correct" : "wrong";
      const nextResults: ("correct" | "wrong" | "timeout")[] = [...results, outcome];
      setResults(nextResults);

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
      } else {
        setStreak(0);
      }

      // Brief flash then auto-advance
      advanceTimeoutRef.current = setTimeout(
        () => advanceToNext(nextResults),
        800
      );
    },
    [
      selectedOption,
      clearTimers,
      current,
      results,
      streak,
      bestStreak,
      advanceToNext,
    ]
  );

  const handleTimeout = useCallback(() => {
    if (selectedOption !== null) return;
    clearTimers();
    setSelectedOption(-1); // sentinel for "timed out"
    setStreak(0);

    const nextResults = [...results, "timeout" as const];
    setResults(nextResults);

    advanceTimeoutRef.current = setTimeout(
      () => advanceToNext(nextResults),
      800
    );
  }, [selectedOption, clearTimers, results, advanceToNext]);

  // Start the countdown when playing and question changes
  useEffect(() => {
    if (phase !== "playing" || selectedOption !== null) return;

    setTimeLeft(data.timePerQuestion);
    const start = Date.now();
    const duration = data.timePerQuestion * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining / 1000);

      if (remaining <= 0) {
        handleTimeout();
      }
    }, 50); // High-frequency for smooth arc animation

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, currentIndex, selectedOption, data.timePerQuestion, handleTimeout]);

  const handleStart = useCallback(() => {
    setPhase("playing");
    setStartTime(Date.now());
  }, []);

  const handleRestart = useCallback(() => {
    clearTimers();
    setPhase("ready");
    setCurrentIndex(0);
    setSelectedOption(null);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(data.timePerQuestion);
  }, [clearTimers, data.timePerQuestion]);

  const correct = results.filter((r) => r === "correct").length;
  const wrong = results.filter((r) => r === "wrong").length;
  const timeouts = results.filter((r) => r === "timeout").length;
  const progress =
    ((currentIndex + (selectedOption !== null || phase === "done" ? 1 : 0)) /
      total) *
    100;

  // --- READY STATE ---
  if (phase === "ready") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center w-full rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white"
      >
        <div className="bg-[#0a0a0a] w-full px-6 py-5 text-center">
          <Zap size={28} className="text-amber-400 mx-auto mb-2" />
          <h3 className="text-white text-lg font-semibold tracking-tight">
            Sprint Mode
          </h3>
          <p className="text-[#9CA3AF] text-sm mt-1">{title}</p>
        </div>
        <div className="flex flex-col items-center gap-4 py-8 px-6">
          <div className="flex items-center gap-6 text-sm text-[#6B7280]">
            <span>{total} questions</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>{data.timePerQuestion}s per question</span>
          </div>
          <p className="text-[13px] text-[#9CA3AF] text-center max-w-xs">
            Answer as fast as you can. Wrong answers and timeouts break your
            streak.
          </p>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 mt-2 px-6 py-3 rounded-full bg-[#0a0a0a] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            <Zap size={16} />
            Start Sprint
          </button>
        </div>
      </motion.div>
    );
  }

  // --- DONE STATE ---
  if (phase === "done") {
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
            Sprint Complete
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

          {/* Per-question review dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result === "correct"
                    ? "bg-emerald-100 text-emerald-600"
                    : result === "wrong"
                    ? "bg-red-100 text-red-500"
                    : "bg-amber-100 text-amber-500"
                }`}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-5 mt-3 text-sm">
            <span className="text-emerald-500 font-medium">
              {correct} correct
            </span>
            <span className="text-red-400 font-medium">{wrong} wrong</span>
            {timeouts > 0 && (
              <span className="text-amber-500 font-medium">
                {timeouts} timed out
              </span>
            )}
          </div>

          {bestStreak > 1 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#9CA3AF]">
              <Zap size={12} className="text-amber-400" />
              Best streak: {bestStreak}
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
  const timerFraction = timeLeft / data.timePerQuestion;
  const timerColor =
    timerFraction > 0.5
      ? "#22C55E"
      : timerFraction > 0.25
      ? "#F59E0B"
      : "#EF4444";
  const circumference = 2 * Math.PI * 20;
  const isTimedOut = selectedOption === -1;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-500" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Sprint
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <motion.span
              key={streak}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[12px] font-semibold text-amber-500 flex items-center gap-1"
            >
              <Zap size={12} />
              {streak}x
            </motion.span>
          )}
          <span className="text-[12px] text-[#9CA3AF] tabular-nums font-medium">
            {currentIndex + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0a0a0a] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Question card with timer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4 w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-6"
        >
          {/* Timer + question row */}
          <div className="flex items-start gap-4">
            {/* Circular countdown timer */}
            <div className="relative w-12 h-12 shrink-0">
              <svg
                viewBox="0 0 48 48"
                className="w-full h-full -rotate-90"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerFraction)}
                  style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={{ color: timerColor }}
                >
                  {Math.ceil(timeLeft)}
                </span>
              </div>
            </div>

            <h3 className="text-[16px] font-semibold text-[#0a0a0a] tracking-[-0.2px] leading-[1.5] flex-1">
              {current?.question}
            </h3>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 w-full">
            {current?.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === current.correctIndex;
              const answered = selectedOption !== null;
              const showCorrect = answered && isCorrectOption;
              const showWrong = answered && isSelected && !isCorrectOption;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                    showCorrect
                      ? "bg-emerald-50 border-emerald-400"
                      : showWrong
                      ? "bg-red-50 border-red-300"
                      : isTimedOut
                      ? "opacity-50 border-[#E5E7EB]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
                  } ${
                    answered && !isSelected && !isCorrectOption
                      ? "opacity-40"
                      : ""
                  }`}
                  disabled={answered}
                >
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
                  {showCorrect && (
                    <Check
                      size={16}
                      className="text-emerald-500 ml-auto shrink-0"
                      strokeWidth={3}
                    />
                  )}
                  {showWrong && (
                    <X
                      size={16}
                      className="text-red-400 ml-auto shrink-0"
                      strokeWidth={3}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Timeout indicator */}
          <AnimatePresence>
            {isTimedOut && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-amber-500">
                    <Timer size={12} className="text-white" />
                  </div>
                  <p className="text-[13px] font-semibold text-amber-700">
                    Time&apos;s up!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
