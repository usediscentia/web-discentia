"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Swords,
  Heart,
  Skull,
  Lightbulb,
  Trophy,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Send,
} from "lucide-react";
import type { BossFightData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface BossFightMorphProps {
  exerciseId: string;
  title: string;
  data: BossFightData;
  onComplete?: (result: ExerciseResult) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function BossFightMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: BossFightMorphProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [bossHP, setBossHP] = useState(data.totalHP);
  const [playerLives, setPlayerLives] = useState(data.playerLives);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<"correct" | "wrong" | null>(
    null
  );
  const [hintsUsed, setHintsUsed] = useState(0);
  const [results, setResults] = useState<
    Array<{ roundId: string; correct: boolean; hintsUsed: number }>
  >([]);
  const [phase, setPhase] = useState<"fighting" | "victory" | "defeat">(
    "fighting"
  );
  const [startTime] = useState(Date.now());

  const round = data.rounds[currentRound];
  const hpPercent = (bossHP / data.totalHP) * 100;

  const hpColor =
    hpPercent > 60 ? "#22C55E" : hpPercent > 30 ? "#F59E0B" : "#EF4444";

  const finishGame = useCallback(
    (
      finalPhase: "victory" | "defeat",
      finalResults: Array<{
        roundId: string;
        correct: boolean;
        hintsUsed: number;
      }>
    ) => {
      setPhase(finalPhase);
      const correct = finalResults.filter((r) => r.correct).length;
      const total = data.rounds.length;
      onComplete?.({
        id: nanoid(),
        exerciseId,
        score:
          finalPhase === "victory"
            ? Math.round((correct / total) * 100)
            : Math.round((correct / total) * 100),
        details: {
          total,
          correct,
          wrong: finalResults.filter((r) => !r.correct).length,
          skipped: total - finalResults.length,
        },
        duration: Date.now() - startTime,
        completedAt: Date.now(),
      });
    },
    [data.rounds.length, exerciseId, startTime, onComplete]
  );

  const advanceRound = useCallback(
    (
      wasCorrect: boolean,
      nextHP: number,
      nextLives: number,
      nextResults: Array<{
        roundId: string;
        correct: boolean;
        hintsUsed: number;
      }>
    ) => {
      // Check win/lose conditions
      if (nextHP <= 0) {
        setBossHP(0);
        finishGame("victory", nextResults);
        return;
      }
      if (nextLives <= 0) {
        finishGame("defeat", nextResults);
        return;
      }
      if (currentRound + 1 >= data.rounds.length) {
        // All rounds done but boss still alive — treat as defeat
        finishGame(nextHP <= 0 ? "victory" : "defeat", nextResults);
        return;
      }

      // Advance to next round
      setTimeout(() => {
        setCurrentRound((r) => r + 1);
        setAnswer("");
        setSelectedOption(null);
        setRoundResult(null);
        setHintsUsed(0);
      }, 1500);
    },
    [currentRound, data.rounds.length, finishGame]
  );

  const checkAnswer = useCallback(
    (userAnswer: string) => {
      if (!round) return;

      const isCorrect =
        userAnswer.toLowerCase().trim() ===
        round.correctAnswer.toLowerCase().trim();

      setRoundResult(isCorrect ? "correct" : "wrong");

      const nextHP = isCorrect
        ? Math.max(0, bossHP - round.damage)
        : bossHP;
      const nextLives = isCorrect ? playerLives : playerLives - 1;

      if (isCorrect) setBossHP(nextHP);
      else setPlayerLives(nextLives);

      const roundEntry = {
        roundId: round.id,
        correct: isCorrect,
        hintsUsed,
      };
      const nextResults = [...results, roundEntry];
      setResults(nextResults);

      advanceRound(isCorrect, nextHP, nextLives, nextResults);
    },
    [round, bossHP, playerLives, hintsUsed, results, advanceRound]
  );

  const handleOptionSelect = useCallback(
    (idx: number) => {
      if (roundResult !== null || !round?.options) return;
      setSelectedOption(idx);
      checkAnswer(round.options[idx]);
    },
    [roundResult, round, checkAnswer]
  );

  const handleFreeFormSubmit = useCallback(() => {
    if (roundResult !== null || !answer.trim()) return;
    checkAnswer(answer.trim());
  }, [roundResult, answer, checkAnswer]);

  const handleHint = useCallback(() => {
    if (!round || hintsUsed >= round.hints.length || hintsUsed >= 2) return;
    setHintsUsed((h) => h + 1);
  }, [round, hintsUsed]);

  const handleRestart = useCallback(() => {
    setCurrentRound(0);
    setBossHP(data.totalHP);
    setPlayerLives(data.playerLives);
    setAnswer("");
    setSelectedOption(null);
    setRoundResult(null);
    setHintsUsed(0);
    setResults([]);
    setPhase("fighting");
  }, [data.totalHP, data.playerLives]);

  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct).length;
  const total = data.rounds.length;
  const score = Math.round((correct / total) * 100);

  // --- VICTORY / DEFEAT SCREEN ---
  if (phase === "victory" || phase === "defeat") {
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
            {phase === "victory" ? (
              <Trophy size={28} className="text-amber-400 mx-auto mb-2" />
            ) : (
              <Skull size={28} className="text-red-400 mx-auto mb-2" />
            )}
          </motion.div>
          <h3 className="text-white text-lg font-semibold tracking-tight">
            {phase === "victory" ? "Boss Defeated!" : "Game Over"}
          </h3>
          <p className="text-[#9CA3AF] text-sm mt-1">
            {data.bossName} — {title}
          </p>
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

          {/* Per-round review dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {results.map((r, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  r.correct
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

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-medium cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            <RefreshCw size={14} />
            {phase === "victory" ? "Play Again" : "Try Again"}
          </button>
        </div>
      </motion.div>
    );
  }

  // --- FIGHTING STATE ---
  if (!round) return null;

  const isMultipleChoice = round.type === "multiple_choice" && round.options;
  const correctOptionIdx = round.options?.findIndex(
    (o) => o.toLowerCase().trim() === round.correctAnswer.toLowerCase().trim()
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={15} className="text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Boss Fight
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <span className="text-[12px] text-[#9CA3AF] tabular-nums font-medium">
          Round {currentRound + 1} / {total}
        </span>
      </div>

      {/* Boss bar */}
      <div className="w-full bg-[#0a0a0a] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skull size={16} className="text-[#9CA3AF]" />
            <span className="text-white text-[14px] font-semibold">
              {data.bossName}
            </span>
            {round.isLeech && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                <Skull size={10} />
                Leech
              </span>
            )}
          </div>
          <span className="text-[12px] text-[#9CA3AF] tabular-nums">
            {bossHP} / {data.totalHP} HP
          </span>
        </div>

        {/* HP bar */}
        <div className="w-full h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: hpColor }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Player lives */}
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: data.playerLives }).map((_, i) => (
            <motion.div
              key={i}
              animate={
                i === playerLives && roundResult === "wrong"
                  ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] }
                  : {}
              }
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={16}
                className={
                  i < playerLives
                    ? "text-red-400 fill-red-400"
                    : "text-[#333] fill-none"
                }
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRound}
          initial={{ opacity: 0, x: 20 }}
          animate={
            roundResult === "wrong"
              ? { opacity: 1, x: [0, -6, 6, -6, 6, 0] }
              : roundResult === "correct"
              ? { opacity: 1, x: 0 }
              : { opacity: 1, x: 0 }
          }
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col gap-4 w-full bg-white rounded-2xl border-2 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-6 transition-colors ${
            roundResult === "correct"
              ? "border-emerald-300"
              : roundResult === "wrong"
              ? "border-red-300"
              : "border-[#E5E7EB]"
          }`}
        >
          <h3 className="text-[16px] font-semibold text-[#0a0a0a] tracking-[-0.2px] leading-[1.5]">
            {round.question}
          </h3>

          {/* Hints */}
          {round.hints.length > 0 && hintsUsed < 2 && roundResult === null && (
            <button
              onClick={handleHint}
              className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[12px] font-medium text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <Lightbulb size={12} />
              Hint ({hintsUsed}/{Math.min(2, round.hints.length)})
            </button>
          )}

          <AnimatePresence>
            {hintsUsed > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1.5">
                  {round.hints.slice(0, hintsUsed).map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 text-[13px] text-amber-700"
                    >
                      <Lightbulb
                        size={12}
                        className="shrink-0 mt-0.5 text-amber-500"
                      />
                      {hint}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiple choice options */}
          {isMultipleChoice && round.options && (
            <div className="flex flex-col gap-2 w-full">
              {round.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === correctOptionIdx;
                const showCorrect = roundResult !== null && isCorrectOption;
                const showWrong =
                  roundResult === "wrong" && isSelected && !isCorrectOption;

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    whileTap={roundResult === null ? { scale: 0.98 } : {}}
                    className={`flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      showCorrect
                        ? "bg-emerald-50 border-emerald-400"
                        : showWrong
                        ? "bg-red-50 border-red-300"
                        : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
                    } ${
                      roundResult !== null &&
                      !isSelected &&
                      !isCorrectOption
                        ? "opacity-50"
                        : ""
                    }`}
                    disabled={roundResult !== null}
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
          )}

          {/* Free form / fill gap input */}
          {!isMultipleChoice && (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFreeFormSubmit();
                }}
                disabled={roundResult !== null}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-[#E5E7EB] text-[14px] text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0a0a0a] transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleFreeFormSubmit}
                disabled={roundResult !== null || !answer.trim()}
                className={`p-3 rounded-xl transition-colors cursor-pointer ${
                  answer.trim() && roundResult === null
                    ? "bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]"
                    : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          )}

          {/* Round result feedback */}
          <AnimatePresence>
            {roundResult !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl ${
                    roundResult === "correct" ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      roundResult === "correct"
                        ? "bg-emerald-500"
                        : "bg-red-400"
                    }`}
                  >
                    {roundResult === "correct" ? (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    ) : (
                      <X size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-semibold ${
                        roundResult === "correct"
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {roundResult === "correct"
                        ? `Correct! -${round.damage} HP`
                        : "Wrong! -1 Life"}
                    </p>
                    {roundResult === "wrong" && (
                      <p className="text-[13px] text-[#6B7280] mt-0.5">
                        Answer: {round.correctAnswer}
                      </p>
                    )}
                  </div>
                  {currentRound + 1 < total && (
                    <div className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                      Next
                      <ChevronRight size={12} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
