"use client";

import { Flame, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CardDots } from "./CardDots";
import { useStudyStore } from "@/stores/study.store";

export function StudyRail() {
  const {
    cards,
    currentIndex,
    results,
    streak,
    dueToday,
    reviewedToday,
    upcomingReviews,
    activeLibraryName,
    activeLibraryColor,
  } = useStudyStore();

  const completedCount = results.length;
  const total = cards.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <aside className="w-[220px] shrink-0 border-r border-gray-100 bg-white p-5 flex flex-col gap-6 overflow-y-auto">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-gray-900">{completedCount}</span>
          <span className="text-xs text-gray-400">of {total} cards</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Card dots */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Queue</span>
          <CardDots total={total} currentIndex={currentIndex} results={results} />
        </div>
      )}

      {/* Streak */}
      <div className="flex items-center gap-2">
        <Flame size={14} className="text-orange-400" />
        <span className="text-sm font-medium text-gray-700">
          {streak} day{streak !== 1 ? "s" : ""} streak
        </span>
      </div>

      {/* Due today context */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Today</span>
        <span className="text-sm text-gray-600">
          {reviewedToday} reviewed · {dueToday} due
        </span>
      </div>

      {/* Upcoming reviews */}
      {upcomingReviews.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Upcoming</span>
          {upcomingReviews.filter((u) => u.count > 0).slice(0, 4).map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <Calendar size={12} className="text-gray-300" />
              <span className="text-xs text-gray-500 flex-1">{u.label}</span>
              <span className="text-xs font-medium text-gray-700">{u.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active library */}
      {activeLibraryName && (
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeLibraryColor ?? "#34D399" }}
          />
          <span className="text-xs text-gray-500 truncate">{activeLibraryName}</span>
        </div>
      )}
    </aside>
  );
}
