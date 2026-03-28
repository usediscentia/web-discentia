"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import type { DashboardDueByLibrary } from "@/types/dashboard";

interface LibraryReviewsProps {
  libraries: DashboardDueByLibrary[];
}

const DOT_COLORS = [
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
];

export default function LibraryReviews({ libraries }: LibraryReviewsProps) {
  const { setActiveView } = useAppStore();
  const rows = libraries.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.16 }}
      className="flex flex-1 flex-col gap-5 rounded-[12px] border border-[#E8E5E0] bg-white p-6"
    >
      <span
        className="text-[13px] font-medium uppercase text-[#9C9690]"
        style={{ letterSpacing: 1 }}
      >
        Reviews by library
      </span>

      {rows.length === 0 ? (
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-[#1A1814]">All caught up</span>
          <span className="text-[14px] font-semibold text-[#1A1814]">0 cards</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {rows.map((lib, index) => {
            const dotColor = DOT_COLORS[index % DOT_COLORS.length];
            return (
              <div key={lib.libraryId ?? `library-${index}`}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="text-[14px] text-[#1A1814]">{lib.name}</span>
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1814]">
                    {lib.dueCount} cards
                  </span>
                </div>
                {index < rows.length - 1 ? (
                  <div className="h-px w-full bg-[#F0EDE9]" />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="h-1" />
      <Button
        className="h-auto w-fit rounded-[8px] bg-[#1A1814] px-5 py-2.5 text-[14px] font-medium text-[#FAFAF8] shadow-none transition-colors hover:bg-[#2A2722]"
        onClick={() => setActiveView("study")}
      >
        Start Reviewing
        <span className="ml-1">→</span>
      </Button>
    </motion.div>
  );
}
