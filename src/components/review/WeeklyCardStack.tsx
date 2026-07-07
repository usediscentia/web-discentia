"use client";

import { motion } from "motion/react";
import type { WeekDayData } from "@/types/dashboard";

interface WeeklyCardStackProps {
  days: WeekDayData[];
}

const DOT_SIZE = 6; // px
const DOT_GAP = 3; // px
const COLUMN_HEIGHT = 72; // px — fixed height for the dot area

function DotColor({ status }: { status: WeekDayData["status"] }) {
  switch (status) {
    case "today":
      return "bg-emerald-400";
    case "completed":
      return "bg-transparent border border-gray-300";
    case "heavy":
      return "bg-violet-400";
    default:
      return "bg-gray-300";
  }
}

const LEGEND = [
  { label: "hoje", colorClass: "bg-emerald-400" },
  { label: "dia pesado", colorClass: "bg-violet-400" },
  { label: "pendente", colorClass: "bg-gray-300" },
  { label: "concluído", colorClass: "bg-transparent border border-gray-300" },
];

export function WeeklyCardStack({ days }: WeeklyCardStackProps) {
  if (days.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <span className="text-[11px] font-medium uppercase text-gray-400" style={{ letterSpacing: 1 }}>
        Esta semana
      </span>

      {/* Columns */}
      <div className="flex items-end justify-between w-full px-1">
        {days.map((day, colIndex) => {
          const isToday = day.status === "today";
          const colDelay = colIndex * 0.08;

          return (
            <div
              key={day.dateKey}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 ${isToday ? "bg-emerald-50" : ""}`}
              style={{ minWidth: 32 }}
            >
              {/* Dot stack area — fixed height, dots grow from bottom */}
              <div
                className="flex flex-col-reverse items-center justify-start"
                style={{ height: COLUMN_HEIGHT, gap: DOT_GAP }}
              >
                {Array.from({ length: day.dotCount }).map((_, dotIndex) => (
                  <motion.div
                    key={dotIndex}
                    className={`rounded-full shrink-0 ${DotColor({ status: day.status })}`}
                    style={{ width: DOT_SIZE, height: DOT_SIZE }}
                    initial={{ opacity: 0, y: 6, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: colDelay + dotIndex * 0.04,
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                    }}
                  />
                ))}
              </div>

              {/* Day label */}
              <span
                className={`text-[9px] font-medium uppercase tracking-wide ${isToday ? "text-emerald-600" : "text-gray-400"}`}
              >
                {day.label}
              </span>

              {/* Date badge */}
              {isToday ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white">{day.dateNumber}</span>
                </div>
              ) : (
                <span className="text-[11px] text-gray-400">{day.dateNumber}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {LEGEND.map(({ label, colorClass }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`rounded-full shrink-0 ${colorClass}`}
              style={{ width: DOT_SIZE, height: DOT_SIZE }}
            />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
