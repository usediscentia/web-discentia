"use client";

import { motion } from "motion/react";
import { Check, Minus, X, Flame } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { ProgressRing } from "./ProgressRing";

interface ReviewCompleteProps {
  total: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  streak: number;
  sessionDuration: number; // ms
  accentColor: string;
  onRestart: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function ReviewComplete({
  total,
  correctCount,
  partialCount,
  incorrectCount,
  streak,
  sessionDuration,
  accentColor,
  onRestart,
}: ReviewCompleteProps) {
  const { setActiveView } = useAppStore();
  const accuracy =
    total > 0 ? Math.round(((correctCount + partialCount * 0.5) / total) * 100) : 0;

  const stats = [
    {
      icon: Check,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      label: "Correct",
      value: correctCount,
    },
    {
      icon: Minus,
      color: "text-amber-600",
      bg: "bg-amber-100",
      label: "Partial",
      value: partialCount,
    },
    {
      icon: X,
      color: "text-red-500",
      bg: "bg-red-100",
      label: "Incorrect",
      value: incorrectCount,
    },
  ];

  return (
    <div className="flex items-center justify-center h-full px-4 py-8 overflow-auto">
      <div className="flex flex-col items-center gap-7 w-full max-w-sm">
        {/* Progress ring — fully filled, celebration pulse */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.06, 1], opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <ProgressRing current={total} total={total} accentColor={accentColor} size={96} />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.18 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900">Session Complete!</h2>
          <p className="text-sm text-gray-400 mt-1">
            {total} {total === 1 ? "card" : "cards"} reviewed — keep it up
          </p>
        </motion.div>

        {/* Stats card */}
        <motion.div
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.28 }}
        >
          {stats.map(({ icon: Icon, color, bg, label, value }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.33 + i * 0.05 }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}
              >
                <Icon size={13} className={color} />
              </div>
              <span className="text-sm text-gray-600 flex-1">{label}</span>
              <span className={`text-sm font-semibold ${color}`}>{value}</span>
            </motion.div>
          ))}

          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Accuracy</span>
              <span className="text-sm font-semibold text-gray-900">{accuracy}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Time</span>
              <span className="text-sm text-gray-400">{formatDuration(sessionDuration)}</span>
            </div>
          </div>
        </motion.div>

        {/* Streak badge */}
        {streak > 0 && (
          <motion.div
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.48 }}
          >
            <Flame size={15} className="text-orange-500 shrink-0" />
            <span className="text-sm font-medium text-orange-700">
              {streak === 1 ? "Streak started!" : `${streak}-day streak!`}
            </span>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
        >
          <button
            onClick={() => setActiveView("dashboard")}
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onRestart}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-center"
          >
            Review more decks →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
