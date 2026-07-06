"use client";

import { ArrowLeft, Flame, Calendar } from "lucide-react";
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
    initSession,
  } = useStudyStore();

  const completedCount = results.length;
  const total = cards.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const upcoming = upcomingReviews.filter((u) => u.count > 0).slice(0, 4);

  return (
    <aside className="w-[220px] shrink-0 border-r border-[#ECE8E2] bg-white p-5 flex flex-col gap-6 overflow-y-auto">
      {/* Exit — progress is already saved card by card */}
      <button
        onClick={() => void initSession()}
        className="flex items-center gap-1.5 text-xs text-[#9C9690] hover:text-[#1A1814] transition-colors cursor-pointer self-start"
      >
        <ArrowLeft size={13} />
        Encerrar sessão
      </button>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-[#1A1814]">{completedCount}</span>
          <span className="text-xs text-[#9C9690]">de {total} cards</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Card dots */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#9C9690] uppercase tracking-wider">Fila</span>
          <CardDots total={total} currentIndex={currentIndex} results={results} />
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm font-medium text-[#6B6560]">
            {streak} {streak === 1 ? "dia" : "dias"} de streak
          </span>
        </div>
      )}

      {/* Due today context */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-[#9C9690] uppercase tracking-wider">Hoje</span>
        <span className="text-sm text-[#6B6560]">
          {reviewedToday} revisados · {dueToday} pendentes
        </span>
      </div>

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-[#9C9690] uppercase tracking-wider">Próximas</span>
          {upcoming.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <Calendar size={12} className="text-[#C8C4BE]" />
              <span className="text-xs text-[#9C9690] flex-1">{u.label}</span>
              <span className="text-xs font-medium text-[#6B6560]">{u.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active library */}
      {activeLibraryName && (
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[#F0EDE8]">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeLibraryColor ?? "#34D399" }}
          />
          <span className="text-xs text-[#9C9690] truncate">{activeLibraryName}</span>
        </div>
      )}
    </aside>
  );
}
