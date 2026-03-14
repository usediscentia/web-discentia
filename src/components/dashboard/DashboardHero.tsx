"use client";

import { Flame } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import type { DashboardStats } from "@/types/dashboard";

interface DashboardHeroProps {
  stats: DashboardStats;
  streak: number;
}

export default function DashboardHero({ stats, streak }: DashboardHeroProps) {
  const { setActiveView } = useAppStore();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-[#171717]"
      style={{ padding: "28px 32px" }}
    >
      {/* Subtle gradient orb for depth */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, #ffffff 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-1.5">
        <span className="text-[19px] font-semibold tracking-[-0.01em] text-white">
          {greeting}! You have{" "}
          <span className="text-[#E2E8F0]">{stats.dueToday} cards</span> to
          review today.
        </span>
        <span className="text-[14px] text-[#71717A]">
          {streak > 0
            ? `Keep your streak going — ${streak} day${streak !== 1 ? "s" : ""} strong.`
            : "Start reviewing to build your streak!"}
        </span>
      </div>

      <div className="relative flex items-center gap-3">
        {/* Streak pill */}
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 backdrop-blur-sm">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 4,
              ease: "easeInOut",
            }}
          >
            <Flame size={18} className="text-amber-400" />
          </motion.div>
          <span className="text-[17px] font-bold tabular-nums text-amber-400">
            {streak}
          </span>
        </div>

        <Button
          className="rounded-xl bg-white px-5 py-2.5 text-[13px] font-medium text-[#171717] shadow-none transition-all hover:bg-white/90 active:scale-[0.97]"
          disabled={stats.dueToday === 0}
          onClick={() => setActiveView("review")}
        >
          Start Review
          <span className="ml-1 opacity-50">→</span>
        </Button>
      </div>
    </motion.div>
  );
}
