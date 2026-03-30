"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardsPerDay } from "@/lib/distribute-cards";

type QuickOption = "1w" | "2w" | "1m" | "custom";

const QUICK_OPTIONS: { id: QuickOption; label: string }[] = [
  { id: "1w", label: "1 semana" },
  { id: "2w", label: "2 semanas" },
  { id: "1m", label: "1 mês" },
  { id: "custom", label: "Escolher data" },
];

function addDaysToDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function quickOptionToDate(option: QuickOption): Date | null {
  switch (option) {
    case "1w": return addDaysToDate(7);
    case "2w": return addDaysToDate(14);
    case "1m": return addDaysToDate(30);
    default: return null;
  }
}

function toInputDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function tomorrowString(): string {
  return toInputDateString(addDaysToDate(1));
}

interface ScheduleStepProps {
  cardCount: number;
  onConfirm: (targetDate: Date) => void;
}

export default function ScheduleStep({ cardCount, onConfirm }: ScheduleStepProps) {
  const [selected, setSelected] = useState<QuickOption>("2w");
  const [customDateStr, setCustomDateStr] = useState("");

  const targetDate = useMemo(() => {
    if (selected === "custom") {
      if (!customDateStr) return null;
      const d = new Date(customDateStr + "T00:00:00");
      return isNaN(d.getTime()) ? null : d;
    }
    return quickOptionToDate(selected);
  }, [selected, customDateStr]);

  const avgPerDay = targetDate ? cardsPerDay(cardCount, targetDate) : null;
  const isTooMany = avgPerDay !== null && avgPerDay > 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="flex flex-col gap-6 py-4"
    >
      {/* Header */}
      <div>
        <h3 className="text-[15px] font-semibold text-[#0C0C0C]">
          Quando você precisa dominar esse conteúdo?
        </h3>
        <p className="text-sm text-[#7C7974] mt-1">
          Vou distribuir os cards para você chegar pronto na data.
        </p>
      </div>

      {/* Quick options */}
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              selected === opt.id
                ? "bg-[#0C0C0C] text-white"
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
            }`}
          >
            {opt.id === "custom" && <Calendar size={14} className="inline mr-1.5 -mt-0.5" />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      {selected === "custom" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <input
            type="date"
            min={tomorrowString()}
            value={customDateStr}
            onChange={(e) => setCustomDateStr(e.target.value)}
            className="w-full rounded-lg border border-[#E4E3E1] px-3 py-2 text-sm text-[#0C0C0C] outline-none focus:border-[#0C0C0C] transition-colors"
          />
        </motion.div>
      )}

      {/* Cards per day info */}
      {avgPerDay !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-[#7C7974]">
            Serão <span className="font-semibold text-[#0C0C0C]">{avgPerDay} cards por dia</span> em média
          </p>
          {isTooMany && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Muitos cards por dia. Considere uma data mais distante.</span>
            </div>
          )}
        </div>
      )}

      {/* Confirm */}
      <Button
        onClick={() => targetDate && onConfirm(targetDate)}
        disabled={!targetDate}
        className="w-full"
      >
        Confirmar e distribuir
      </Button>
    </motion.div>
  );
}
