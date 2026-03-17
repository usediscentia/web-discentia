"use client";

import { motion } from "motion/react";
import { useAppStore } from "@/stores/app.store";

interface ReviewCompleteProps {
  reviewed: number;
  correct: number;
  streak: number;
  onRestart: () => void;
}

export function ReviewComplete({ reviewed, correct, streak, onRestart }: ReviewCompleteProps) {
  const { setActiveView } = useAppStore();

  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center gap-8 bg-white rounded-2xl border border-[#E5E7EB] p-12 w-full max-w-md text-center"
      >
        {/* Badge */}
        <div className="w-16 h-16 rounded-full bg-[#E6F5F3] flex items-center justify-center text-3xl">
          🎉
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-[#111]">Session complete!</h2>
          <p className="text-sm text-[#9CA3AF]">
            You reviewed {reviewed} cards. Keep it up — consistency is everything.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { value: String(reviewed), label: "Reviewed" },
            { value: `${correct}/${reviewed}`, label: "Correct", color: "text-[#1A7A6D]" },
            { value: `${streak}`, label: "Day Streak" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-4 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6]">
              <span className={`text-2xl font-bold text-[#111] ${s.color ?? ""}`}>{s.value}</span>
              <span className="text-[11px] text-[#9CA3AF] font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setActiveView("dashboard")}
            className="flex-1 py-2.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-xl cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            ← Dashboard
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#1A7A6D] rounded-xl cursor-pointer hover:bg-[#15665B] transition-colors"
          >
            Review more
          </button>
        </div>
      </motion.div>
    </div>
  );
}
