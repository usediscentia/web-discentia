"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Grid3X3,
  Shuffle,
  Trophy,
  RefreshCw,
} from "lucide-react";
import type { ConnectionsData, ExerciseResult } from "@/types/exercise";
import { nanoid } from "nanoid";

interface ConnectionsMorphProps {
  exerciseId: string;
  title: string;
  data: ConnectionsData;
  onComplete?: (result: ExerciseResult) => void;
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#FBBF24",
  2: "#34D399",
  3: "#60A5FA",
  4: "#A78BFA",
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ConnectionsMorph({
  exerciseId,
  title,
  data,
  onComplete,
}: ConnectionsMorphProps) {
  const allWords = useMemo(
    () => data.groups.flatMap((g) => g.words),
    [data.groups]
  );

  const [remainingWords, setRemainingWords] = useState(() =>
    shuffleArray(allWords)
  );
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<
    ConnectionsData["groups"][number][]
  >([]);
  const [mistakes, setMistakes] = useState(4);
  const [completed, setCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [oneAwayHint, setOneAwayHint] = useState(false);
  const [startTime] = useState(Date.now());

  const toggleWord = useCallback(
    (word: string) => {
      if (completed || gameOver) return;
      setSelectedWords((prev) =>
        prev.includes(word)
          ? prev.filter((w) => w !== word)
          : prev.length < 4
          ? [...prev, word]
          : prev
      );
    },
    [completed, gameOver]
  );

  const handleDeselectAll = useCallback(() => {
    setSelectedWords([]);
  }, []);

  const handleShuffle = useCallback(() => {
    setRemainingWords((prev) => shuffleArray(prev));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== 4) return;

    const matchedGroup = data.groups.find(
      (g) =>
        !solvedGroups.includes(g) &&
        selectedWords.every((w) => g.words.includes(w)) &&
        g.words.every((w) => selectedWords.includes(w))
    );

    if (matchedGroup) {
      const nextSolved = [...solvedGroups, matchedGroup];
      setSolvedGroups(nextSolved);
      setRemainingWords((prev) =>
        prev.filter((w) => !matchedGroup.words.includes(w))
      );
      setSelectedWords([]);

      if (nextSolved.length === data.groups.length) {
        setCompleted(true);
        const score = Math.round(
          (mistakes / 4) * 100
        );
        onComplete?.({
          id: nanoid(),
          exerciseId,
          score,
          details: {
            total: data.groups.length,
            correct: data.groups.length,
            wrong: 4 - mistakes,
            skipped: 0,
          },
          duration: Date.now() - startTime,
          completedAt: Date.now(),
        });
      }
    } else {
      // Check "one away"
      const isOneAway = data.groups.some(
        (g) =>
          !solvedGroups.includes(g) &&
          selectedWords.filter((w) => g.words.includes(w)).length === 3
      );

      if (isOneAway) {
        setOneAwayHint(true);
        setTimeout(() => setOneAwayHint(false), 2000);
      }

      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);

      const nextMistakes = mistakes - 1;
      setMistakes(nextMistakes);
      setSelectedWords([]);

      if (nextMistakes <= 0) {
        setGameOver(true);
        // Reveal all remaining groups
        const remaining = data.groups.filter((g) => !solvedGroups.includes(g));
        setSolvedGroups([...solvedGroups, ...remaining]);
        setRemainingWords([]);
        onComplete?.({
          id: nanoid(),
          exerciseId,
          score: Math.round((solvedGroups.length / data.groups.length) * 100),
          details: {
            total: data.groups.length,
            correct: solvedGroups.length,
            wrong: data.groups.length - solvedGroups.length,
            skipped: 0,
          },
          duration: Date.now() - startTime,
          completedAt: Date.now(),
        });
      }
    }
  }, [
    selectedWords,
    data.groups,
    solvedGroups,
    mistakes,
    exerciseId,
    startTime,
    onComplete,
  ]);

  const handleRestart = useCallback(() => {
    setRemainingWords(shuffleArray(allWords));
    setSelectedWords([]);
    setSolvedGroups([]);
    setMistakes(4);
    setCompleted(false);
    setGameOver(false);
    setShakeWrong(false);
    setOneAwayHint(false);
  }, [allWords]);

  // Build grid rows from remaining words
  const rows: string[][] = [];
  for (let i = 0; i < remainingWords.length; i += 4) {
    rows.push(remainingWords.slice(i, i + 4));
  }

  const score = completed
    ? Math.round((mistakes / 4) * 100)
    : gameOver
    ? Math.round((solvedGroups.length / data.groups.length) * 100)
    : 0;

  // --- COMPLETION / GAME OVER SCREEN ---
  if (completed || gameOver) {
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
            {completed ? "Connections Complete" : "Game Over"}
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

          {/* Solved groups review */}
          <div className="flex flex-col gap-2 mt-4 w-full px-6">
            {data.groups
              .sort((a, b) => a.difficulty - b.difficulty)
              .map((group, i) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center gap-0.5 py-3 rounded-xl"
                  style={{
                    backgroundColor:
                      DIFFICULTY_COLORS[group.difficulty] + "20",
                  }}
                >
                  <span
                    className="text-xs font-bold tracking-[1px] uppercase"
                    style={{
                      color: DIFFICULTY_COLORS[group.difficulty],
                    }}
                  >
                    {group.category}
                  </span>
                  <span className="text-[13px] font-medium text-[#6B7280]">
                    {group.words.join(" · ")}
                  </span>
                </motion.div>
              ))}
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-emerald-500 font-medium">
              {completed ? data.groups.length : solvedGroups.length - (data.groups.length - solvedGroups.length)} found
            </span>
            <span className="text-red-400 font-medium">
              {4 - mistakes} mistake{4 - mistakes !== 1 ? "s" : ""}
            </span>
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

  // --- PLAYING STATE ---
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 size={15} className="text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Connections
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            {title}
          </span>
        </div>
        <span className="text-[12px] text-[#9CA3AF] tabular-nums font-medium">
          {solvedGroups.length} / {data.groups.length}
        </span>
      </div>

      {/* Solved groups stacking at top */}
      <AnimatePresence>
        {solvedGroups.map((group) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            className="flex flex-col items-center gap-0.5 w-full py-3.5 rounded-xl overflow-hidden"
            style={{
              backgroundColor: DIFFICULTY_COLORS[group.difficulty] + "20",
            }}
          >
            <span
              className="text-xs font-bold tracking-[1px] uppercase"
              style={{ color: DIFFICULTY_COLORS[group.difficulty] }}
            >
              {group.category}
            </span>
            <span className="text-[13px] font-medium text-[#6B7280]">
              {group.words.join(" · ")}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* One-away hint toast */}
      <AnimatePresence>
        {oneAwayHint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-center py-2 px-4 rounded-lg bg-amber-50 border border-amber-200"
          >
            <span className="text-[13px] font-medium text-amber-700">
              One away!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word grid */}
      <motion.div
        animate={shakeWrong ? { x: [0, -6, 6, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 w-full"
      >
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 w-full">
            {row.map((word) => {
              const isSelected = selectedWords.includes(word);
              return (
                <motion.button
                  key={word}
                  layout
                  onClick={() => toggleWord(word)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 flex items-center justify-center h-14 rounded-[10px] cursor-pointer transition-colors text-sm font-semibold ${
                    isSelected
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#F3F4F6] text-[#1A1A1A] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#6B7280]">
            Mistakes remaining:
          </span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < mistakes ? "bg-[#1A1A1A]" : "bg-[#E5E7EB]"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E7EB] text-[13px] font-medium text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            <Shuffle size={14} />
            Shuffle
          </button>
          {selectedWords.length > 0 && (
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 rounded-full border border-[#E5E7EB] text-[13px] font-medium text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            >
              Deselect All
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={selectedWords.length !== 4}
            className={`px-6 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
              selectedWords.length === 4
                ? "bg-[#1A1A1A] text-white hover:bg-[#333]"
                : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
