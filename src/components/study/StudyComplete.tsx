"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Minus, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/stores/study.store";
import { useAppStore } from "@/stores/app.store";
import { MistakeAnalyzer } from "./MistakeAnalyzer";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export function StudyComplete() {
  const { results, streak, sessionStartTime, restartSession } = useStudyStore();
  const { setActiveView } = useAppStore();
  const [duration] = useState(() =>
    sessionStartTime > 0 ? Date.now() - sessionStartTime : 0
  );

  const total = results.length;
  const correctCount = results.filter((r) => r.verdict === "correct").length;
  const partialCount = results.filter((r) => r.verdict === "partial").length;
  const incorrectCount = results.filter((r) => r.verdict === "incorrect" || r.verdict === null).length;
  const accuracy = total > 0 ? Math.round(((correctCount + partialCount * 0.5) / total) * 100) : 0;
  const stats = [
    { icon: Check, color: "text-emerald-600", bg: "bg-emerald-100", label: "Correct", value: correctCount },
    { icon: Minus, color: "text-amber-600", bg: "bg-amber-100", label: "Partial", value: partialCount },
    { icon: X, color: "text-red-500", bg: "bg-red-100", label: "Incorrect", value: incorrectCount },
  ];

  return (
    <div className="flex items-center justify-center h-full px-4 py-8 overflow-auto">
      <div className="flex flex-col items-center gap-7 w-full max-w-sm">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900">Session Complete!</h2>
          <p className="text-sm text-gray-400 mt-1">
            {total} {total === 1 ? "card" : "cards"} reviewed
          </p>
        </motion.div>

        <motion.div
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.1 }}
        >
          {stats.map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={13} className={color} />
              </div>
              <span className="text-sm text-gray-600 flex-1">{label}</span>
              <span className={`text-sm font-semibold ${color}`}>{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Accuracy</span>
              <span className="text-sm font-semibold text-gray-900">{accuracy}%</span>
            </div>
            {sessionStartTime > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm text-gray-400">{formatDuration(duration)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {streak > 0 && (
          <motion.div
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <Flame size={15} className="text-orange-500 shrink-0" />
            <span className="text-sm font-medium text-orange-700">
              {streak === 1 ? "Streak started!" : `${streak}-day streak!`}
            </span>
          </motion.div>
        )}

        <MistakeAnalyzer results={results} />

        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Button onClick={() => setActiveView("stats")} className="w-full">
            Ver estatísticas
          </Button>
          <button
            onClick={restartSession}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
          >
            Revisar mais cards →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
