"use client";

import { motion } from "motion/react";
import { CheckCircle2, BookOpen, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/stores/study.store";
import { useAppStore } from "@/stores/app.store";
import { CardOrbit } from "./CardOrbit";

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
    accentColors,
    libraryNames,
  } = useStudyStore();

  const setActiveView = useAppStore((s) => s.setActiveView);

  const today = new Date();
  const dateString = formatDateLocale(today);
  const hasDueCards = cards.length > 0;
  const hasAnyCards = totalCardsInSystem > 0;

  const cardOrbitItems = cards.map((card) => ({
    card,
    libraryName: card.libraryItemId ? (libraryNames[card.libraryItemId] ?? "Biblioteca") : "Biblioteca",
    libraryColor: card.libraryItemId ? (accentColors[card.libraryItemId] ?? "#34D399") : "#34D399",
  }));

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
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Nenhum conteúdo ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
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
            className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
          >
            <CheckCircle2 size={28} className="text-emerald-500" />
          </motion.div>

          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Tudo em dia por hoje.
            </p>
            {nextSessionDate && (
              <p className="text-sm text-muted-foreground mt-1.5">
                Próxima revisão {formatFutureDate(nextSessionDate)} · {nextSessionCount} {nextSessionCount === 1 ? "card" : "cards"}
              </p>
            )}
          </div>

          {streak > 0 && (
            <motion.div
              className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
            >
              <Flame size={14} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                {streak === 1 ? "Streak começou!" : `${streak} dias de streak!`}
              </span>
            </motion.div>
          )}

          <button
            onClick={() => setActiveView("library")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-2"
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
    <div className="relative flex items-center justify-center h-full px-4 overflow-hidden">
      <CardOrbit cards={cardOrbitItems} />

      <motion.div
        className="relative flex flex-col items-center gap-6 text-center max-w-sm w-full"
        style={{ zIndex: 20 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Date */}
        <p className="text-sm text-muted-foreground font-medium capitalize">
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
            className="font-bold text-foreground leading-none tracking-tight"
            style={{ fontSize: "clamp(56px, 10vw, 80px)" }}
          >
            {cards.length}
          </span>
          <span className="text-sm text-muted-foreground mt-2">
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
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
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
          className="text-xs text-muted-foreground"
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
