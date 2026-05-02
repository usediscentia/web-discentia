"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import type { DashboardDueByLibrary } from "@/types/dashboard";

interface LibraryReviewsProps {
  libraries: DashboardDueByLibrary[];
}

const BAR_COLORS = ["#22C55E", "#3B82F6", "#8B5CF6", "#F59E0B"];

export default function LibraryReviews({ libraries }: LibraryReviewsProps) {
  const { setActiveView } = useAppStore();
  const rows = libraries.slice(0, 4);
  const total = rows.reduce((sum, lib) => sum + lib.dueCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.16 }}
      className="flex flex-1 flex-col gap-5 rounded-[12px] border border-[#E8E5E0] bg-white p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="text-[13px] font-medium uppercase text-[#9C9690]"
          style={{ letterSpacing: 1 }}
        >
          Reviews by library
        </span>
        <div className="flex flex-col items-end">
          <span className="text-[28px] font-bold leading-none tracking-tight text-[#1A1814] tabular-nums">
            {total}
          </span>
          <span className="text-[11px] text-[#9C9690] mt-0.5">cards due</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-1 items-center justify-center py-4">
          <span className="text-[14px] text-[#9C9690]">All caught up</span>
        </div>
      ) : (
        <>
          {/* Stacked proportion bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#F0EDE9]">
            {rows.map((lib, index) => (
              <motion.div
                key={lib.libraryId ?? `lib-${index}`}
                initial={{ width: 0 }}
                animate={{ width: `${(lib.dueCount / total) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.22 + index * 0.06, ease: "easeOut" }}
                className="h-full"
                style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
              />
            ))}
          </div>

          {/* Library legend */}
          <div className="flex flex-col gap-2.5">
            {rows.map((lib, index) => {
              const pct = Math.round((lib.dueCount / total) * 100);
              return (
                <div
                  key={lib.libraryId ?? `legend-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
                    />
                    <span className="text-[13px] text-[#1A1814] truncate">{lib.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-[#9C9690] tabular-nums">{pct}%</span>
                    <span
                      className="text-[13px] font-semibold text-[#1A1814] tabular-nums"
                      style={{ minWidth: 24, textAlign: "right" }}
                    >
                      {lib.dueCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Button
        className="h-auto w-fit rounded-[8px] px-5 py-2.5 text-[14px] font-medium shadow-none transition-colors mt-auto"
        style={{ backgroundColor: "var(--brand)", color: "var(--brand-foreground)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
        onClick={() => setActiveView("study")}
      >
        Start Reviewing →
      </Button>
    </motion.div>
  );
}
