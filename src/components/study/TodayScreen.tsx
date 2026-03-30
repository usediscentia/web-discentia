"use client";

import { motion } from "motion/react";
import { CheckCircle2, BookOpen, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/stores/study.store";
import { useAppStore } from "@/stores/app.store";

function formatDateLocale(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatFutureDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(timestamp);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 1) return "amanhã";
  if (diffDays <= 7) return `em ${diffDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function TodayScreen() {
  const {
    cards,
    dueToday,
    reviewedToday,
    streak,
    totalCardsInSystem,
    nextSessionDate,
    nextSessionCount,
    startReview,
  } = useStudyStore();

  const setActiveView = useAppStore((s) => s.setActiveView);

  const today = new Date();
  const dateString = formatDateLocale(today);
  const hasDueCards = cards.length > 0;
  const hasAnyCards = totalCardsInSystem > 0;

  // State 3 — No cards at all
  if (!hasAnyCards) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <motion.div
          className="flex flex-col items-center gap-5 text-center max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center">
            <BookOpen size={28} className="text-[#9CA3AF]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#0C0C0C]">
              Nenhum conteúdo ainda.
            </p>
            <p className="text-sm text-[#7C7974] mt-1.5">
              Suba um PDF ou cole um texto — a AI faz o resto
            </p>
          </div>
          <Button
            onClick={() => setActiveView("library")}
            className="mt-2"
          >
            Criar meu primeiro deck
          </Button>
        </motion.div>
      </div>
    );
  }

  // State 2 — All caught up
  if (!hasDueCards) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <motion.div
          className="flex flex-col items-center gap-5 text-center max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
          >
            <CheckCircle2 size={28} className="text-emerald-500" />
          </motion.div>

          <div>
            <p className="text-[15px] font-semibold text-[#0C0C0C]">
              Tudo em dia por hoje.
            </p>
            {nextSessionDate && (
              <p className="text-sm text-[#7C7974] mt-1.5">
                Próxima revisão {formatFutureDate(nextSessionDate)} · {nextSessionCount} {nextSessionCount === 1 ? "card" : "cards"}
              </p>
            )}
          </div>

          {streak > 0 && (
            <motion.div
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
            >
              <Flame size={14} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                {streak === 1 ? "Streak começou!" : `${streak} dias de streak!`}
              </span>
            </motion.div>
          )}

          <button
            onClick={() => setActiveView("library")}
            className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer mt-2"
          >
            Ver todos os decks
          </button>
        </motion.div>
      </div>
    );
  }

  // State 1 — Cards pending (main state)
  const totalDue = dueToday;
  const progress = totalDue > 0 ? Math.round((reviewedToday / (reviewedToday + cards.length)) * 100) : 0;

  return (
    <div className="flex items-center justify-center h-full px-4">
      <motion.div
        className="flex flex-col items-center gap-6 text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Date */}
        <p className="text-sm text-[#9CA3AF] font-medium capitalize">
          {dateString}
        </p>

        {/* Big number */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
        >
          <span
            className="font-bold text-[#0C0C0C] leading-none tracking-tight"
            style={{ fontSize: "clamp(56px, 10vw, 80px)" }}
          >
            {cards.length}
          </span>
          <span className="text-sm text-[#7C7974] mt-2">
            {cards.length === 1 ? "card para revisar hoje" : "cards para revisar hoje"}
          </span>
        </motion.div>

        {/* Progress bar — only show if some reviewed today */}
        {reviewedToday > 0 && (
          <motion.div
            className="w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
              />
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1.5">
              {reviewedToday} revisados hoje
            </p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            onClick={startReview}
            className="w-full gap-2"
            size="lg"
          >
            Começar revisão
            <ArrowRight size={16} />
          </Button>
        </motion.div>

        {/* Streak */}
        {streak > 0 && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Flame size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {streak} {streak === 1 ? "dia" : "dias"} de streak
            </span>
          </motion.div>
        )}

        {/* Footer meta */}
        <motion.p
          className="text-xs text-[#B5B3AE]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {totalCardsInSystem} cards no total
        </motion.p>
      </motion.div>
    </div>
  );
}
