"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cardsPerDay } from "@/lib/distribute-cards";

type QuickOption = "1w" | "2w" | "1m" | "custom";

const QUICK_OPTIONS: { id: QuickOption; label: string }[] = [
  { id: "1w", label: "1 week" },
  { id: "2w", label: "2 weeks" },
  { id: "1m", label: "1 month" },
  { id: "custom", label: "Pick a date" },
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

interface ScheduleStepProps {
  cardCount: number;
  onConfirm: (targetDate: Date) => void;
}

export default function ScheduleStep({ cardCount, onConfirm }: ScheduleStepProps) {
  const [selected, setSelected] = useState<QuickOption>("2w");
  const [customDate, setCustomDate] = useState<Date | undefined>();

  const targetDate = useMemo(() => {
    if (selected === "custom") return customDate ?? null;
    return quickOptionToDate(selected);
  }, [selected, customDate]);

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
          When do you need to master this?
        </h3>
        <p className="text-sm text-[#7C7974] mt-1">
          Cards will be distributed so you arrive ready by that date.
        </p>
      </div>

      {/* Quick options */}
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors active:scale-[0.96] cursor-pointer ${
              selected === opt.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={{ transition: "background-color 150ms ease, color 150ms ease, transform 120ms ease" }}
          >
            {opt.id === "custom" && <CalendarIcon size={14} className="inline mr-1.5 -mt-0.5" />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      <AnimatePresence>
        {selected === "custom" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm font-normal border-[#E4E3E1] text-left"
                >
                  <CalendarIcon size={14} className="mr-2 shrink-0 text-muted-foreground" />
                  {customDate ? format(customDate, "MMMM d, yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards per day info */}
      {avgPerDay !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-[#7C7974]">
            About <span className="font-semibold text-[#0C0C0C]">{avgPerDay} cards per day</span> on average
          </p>
          {isTooMany && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle size={13} className="shrink-0" />
              <span>That&apos;s a lot of daily cards. Consider a later date.</span>
            </div>
          )}
        </div>
      )}

      {/* Confirm */}
      <Button
        onClick={() => targetDate && onConfirm(targetDate)}
        disabled={!targetDate}
        className="w-full active:scale-[0.97]"
        style={{ transition: "background-color 150ms ease, transform 150ms ease, opacity 150ms ease" }}
      >
        Confirm schedule
      </Button>
    </motion.div>
  );
}
