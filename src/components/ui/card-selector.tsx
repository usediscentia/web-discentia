"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useDialKit } from "dialkit";
import { cn } from "@/lib/utils";

interface CardSelectorOption {
  amount: number;
  label: string;
  cards: number;
}

interface CardSelectorProps {
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  disabled?: boolean;
  className?: string;
}

interface CardOptionAnimProps {
  hoverScale: number;
  shadowBlur: number;
  spring: { type: "spring"; visualDuration?: number; bounce?: number };
}

const OPTIONS: CardSelectorOption[] = [
  { amount: 5, label: "Just a few", cards: 1 },
  { amount: 10, label: "Small deck", cards: 2 },
  { amount: 20, label: "Full stack", cards: 4 },
];

function MiniCardStack({
  count,
  hovered,
}: {
  count: number;
  hovered: boolean;
}) {
  return (
    <div className="relative flex h-28 items-center justify-center">
      {Array.from({ length: count }).map((_, index) => {
        let offsetX = 0;
        let offsetY = 0;
        let rotation = 0;

        if (count === 2) {
          offsetX = (index - 0.5) * 10;
          offsetY = index * -2;
          rotation = (index - 0.5) * 4;
        } else if (count > 2) {
          const spread = count === 3 ? 12 : 9;
          offsetX = (index - (count - 1) / 2) * spread;
          offsetY = index * -3;
          rotation = (index - (count - 1) / 2) * 2.5;
        }

        return (
          <motion.div
            key={index}
            className="absolute flex h-[88px] w-[62px] flex-col gap-1 rounded-lg border border-[#E8E5E0] bg-white p-2 shadow-sm"
            style={{ zIndex: index }}
            animate={{
              x: offsetX,
              y: hovered ? offsetY - 6 : offsetY,
              rotate: rotation,
            }}
            transition={{
              delay: hovered ? index * 0.03 : 0,
              duration: 0.18,
              ease: "easeOut",
            }}
          >
            <div className="h-1.5 w-full rounded-sm bg-[#EDEDEA]" />
            <div className="h-1.5 w-3/4 rounded-sm bg-[#EDEDEA]" />
            <div className="flex-1" />
            <div className="h-1.5 w-full rounded-sm bg-[#EDEDEA]" />
            <div className="h-1.5 w-2/3 rounded-sm bg-[#EDEDEA]" />
          </motion.div>
        );
      })}
    </div>
  );
}

function CardOption({
  option,
  selected,
  disabled,
  onSelect,
  anim,
}: {
  option: CardSelectorOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  anim: CardOptionAnimProps;
}) {
  const [hovered, setHovered] = useState(false);

  const shadowValue = `0 ${Math.round(anim.shadowBlur / 3)}px ${anim.shadowBlur}px rgba(0,0,0,0.10)`;

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "relative flex h-full w-full flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1814]/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-[#E8E5E0] bg-[#F5F2EE]"
          : "border-[#E8E5E0] bg-white hover:border-[#C4BFB8]"
      )}
      whileHover={!disabled && !selected ? { scale: anim.hoverScale, boxShadow: shadowValue } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={anim.spring}
    >
      {/* Checkmark badge */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", visualDuration: 0.2, bounce: 0.3 }}
            className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1A1814]"
          >
            <Check size={10} className="text-white" strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>

      <MiniCardStack count={option.cards} hovered={hovered && !disabled} />

      <div className="text-center">
        <div className="text-[14px] font-semibold text-[#1A1814]">
          {option.label}
        </div>
        <div className="text-[12px] text-[#9C9690]">
          {option.amount} cards
        </div>
      </div>
    </motion.button>
  );
}

export function CardSelector({ selectedAmount, onSelect, disabled, className }: CardSelectorProps) {
  const dial = useDialKit("Card Hover", {
    spring: { type: "spring" as const, visualDuration: 0.4, bounce: 0.25 },
    hoverScale: [1.03, 1.0, 1.05, 0.01] as [number, number, number, number],
    shadowBlur: [12, 0, 40, 1] as [number, number, number, number],
  });

  const anim: CardOptionAnimProps = {
    hoverScale: dial.hoverScale,
    shadowBlur: dial.shadowBlur,
    spring: dial.spring as CardOptionAnimProps["spring"],
  };

  return (
    <div
      role="radiogroup"
      aria-label="Number of flashcards"
      className={cn("grid grid-cols-3 gap-3", className)}
    >
      {OPTIONS.map((option) => (
        <CardOption
          key={option.amount}
          option={option}
          selected={selectedAmount === option.amount}
          disabled={disabled}
          onSelect={() => onSelect(option.amount)}
          anim={anim}
        />
      ))}
    </div>
  );
}
