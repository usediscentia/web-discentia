"use client";

import { Check, X, Minus } from "lucide-react";
import { motion } from "motion/react";
import { MiniConfetti } from "./MiniConfetti";

type AIVerdict = "correct" | "partial" | "incorrect";

interface VerdictDisplayProps {
  verdict: AIVerdict | null;
  userAnswer: string;
  explanation: string;
  correctAnswer: string;
  keyMissing?: string | null;
}

const VERDICT_CONFIG = {
  correct: {
    Icon: Check,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    leftBorder: "border-l-emerald-400",
    label: "Correct!",
    labelColor: "text-emerald-600",
  },
  partial: {
    Icon: Minus,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
    leftBorder: "border-l-amber-400",
    label: "Almost there!",
    labelColor: "text-amber-600",
  },
  incorrect: {
    Icon: X,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    cardBg: "bg-red-50",
    cardBorder: "border-red-200",
    leftBorder: "border-l-red-400",
    label: "Not quite",
    labelColor: "text-red-500",
  },
} as const;

const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
});

export function VerdictDisplay({
  verdict,
  userAnswer,
  explanation,
  correctAnswer,
  keyMissing,
}: VerdictDisplayProps) {
  // null = skipped ("I don't know")
  if (verdict === null) {
    return (
      <div className="flex flex-col gap-4">
        <motion.div className="flex flex-col items-center gap-2" {...stagger(0)}>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Minus size={18} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No worries — here&apos;s the answer
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl bg-gray-50 border border-gray-200 p-4"
          {...stagger(0.06)}
        >
          <p className="text-xs text-gray-400 mb-1.5">Correct answer</p>
          <p className="text-sm font-medium text-gray-800 leading-relaxed">{correctAnswer}</p>
        </motion.div>
      </div>
    );
  }

  const cfg = VERDICT_CONFIG[verdict];
  const { Icon } = cfg;

  return (
    <div className="flex flex-col gap-4">
      {/* Icon + label */}
      <motion.div className="flex flex-col items-center gap-2" {...stagger(0)}>
        <div className="relative">
          <motion.div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.iconBg}`}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Icon size={18} className={cfg.iconColor} />
          </motion.div>
          {verdict === "correct" && <MiniConfetti trigger />}
        </div>
        <motion.p
          className={`text-base font-semibold ${cfg.labelColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          {cfg.label}
        </motion.p>
      </motion.div>

      {/* Answer comparison card */}
      <motion.div
        className={`rounded-xl border p-4 flex flex-col gap-3 ${cfg.cardBg} ${cfg.cardBorder}`}
        {...stagger(0.1)}
      >
        {/* User's answer */}
        {userAnswer && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Your answer</p>
            <p className="text-sm text-gray-700 leading-relaxed">{userAnswer}</p>
          </div>
        )}

        {/* Correct answer (shown if not correct) */}
        {verdict !== "correct" && (
          <div className={`pl-3 border-l-2 ${cfg.leftBorder}`}>
            <p className="text-xs text-gray-400 mb-1">Correct answer</p>
            <p className="text-sm font-medium text-gray-800 leading-relaxed">{correctAnswer}</p>
          </div>
        )}

        {/* AI explanation */}
        {explanation && (
          <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
        )}

        {/* Key missing */}
        {keyMissing && verdict !== "correct" && (
          <div className={`pl-3 border-l-2 ${cfg.leftBorder}`}>
            <p
              className={`text-xs font-medium ${
                verdict === "partial" ? "text-amber-700" : "text-red-700"
              }`}
            >
              What was missing
            </p>
            <p
              className={`text-xs mt-0.5 leading-relaxed ${
                verdict === "partial" ? "text-amber-600" : "text-red-600"
              }`}
            >
              {keyMissing}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
