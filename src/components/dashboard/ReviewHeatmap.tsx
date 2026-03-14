"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ReviewHeatmapProps {
  activityByDay: Record<string, number>;
}

const COLORS = ["#EDEDEA", "#C4BFB8", "#8C857C", "#4A443F", "#1A1814"];
const CELL_SIZE = 10;
const TOTAL_WEEKS = 26;

function getColor(count: number): string {
  if (count === 0) return COLORS[0];
  if (count <= 2) return COLORS[1];
  if (count <= 5) return COLORS[2];
  if (count <= 9) return COLORS[3];
  return COLORS[4];
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DayData {
  date: Date;
  count: number;
  key: string;
}

export default function ReviewHeatmap({ activityByDay }: ReviewHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { weeks, months } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = TOTAL_WEEKS * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    const weeksArr: DayData[][] = [];
    const cursor = new Date(startDate);
    for (let weekIndex = 0; weekIndex < TOTAL_WEEKS; weekIndex++) {
      const week: DayData[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const key = toDayKey(cursor);
        const count = activityByDay[key] ?? 0;
        week.push({ date: new Date(cursor), count, key });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeksArr.push(week);
    }

    const monthsArr: { label: string; index: number }[] = [];
    let lastLabel = "";
    weeksArr.forEach((week, weekIndex) => {
      const label = week[0].date.toLocaleString("en-US", { month: "short" });
      if (label !== lastLabel) {
        monthsArr.push({ label, index: weekIndex });
        lastLabel = label;
      }
    });

    return { weeks: weeksArr, months: monthsArr.slice(-6) };
  }, [activityByDay]);

  const handleMouseEnter = useCallback((day: DayData, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const parent = (
      e.target as HTMLElement
    ).closest("[data-heatmap]")!.getBoundingClientRect();
    setTooltipPos({
      x: rect.left - parent.left + rect.width / 2,
      y: rect.top - parent.top - 8,
    });
    setHoveredDay(day);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="flex w-full flex-col gap-4 rounded-[12px] border border-[#E8E5E0] bg-white p-6"
    >
      <div className="flex w-full items-center justify-between">
        <span
          className="text-[13px] font-medium uppercase text-[#9C9690]"
          style={{ letterSpacing: 0.1 }}
        >
          Activity Overview
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#9C9690]">Less</span>
          {COLORS.map((color) => (
            <div
              key={color}
              className="size-[10px] rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[11px] text-[#9C9690]">More</span>
        </div>
      </div>

      <div className="relative" data-heatmap>
        <AnimatePresence>
          {hoveredDay ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-[#1A1814] px-2.5 py-1 text-[11px] text-[#FAFAF8]"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              {hoveredDay.count} review{hoveredDay.count !== 1 ? "s" : ""} on{" "}
              {formatDate(hoveredDay.date)}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mb-2 flex w-full justify-around">
          {months.map((month) => (
            <span key={`${month.label}-${month.index}`} className="text-[10px] text-[#9C9690]">
              {month.label}
            </span>
          ))}
        </div>

        <div className="flex w-full justify-between gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.key}
                  className="cursor-pointer rounded-[2px]"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: getColor(day.count),
                  }}
                  onMouseEnter={(event) => handleMouseEnter(day, event)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
