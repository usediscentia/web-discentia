"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExerciseTileProps {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function ExerciseTile({
  icon,
  label,
  disabled,
  onClick,
}: ExerciseTileProps) {
  const tile = (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors cursor-pointer ${
        disabled
          ? "opacity-40 cursor-not-allowed border-[#E4E3E1] bg-[#F8F8F7]"
          : "border-[#E4E3E1] bg-[#F8F8F7] hover:bg-[#F1F0EF] hover:border-[#D3D1CE] hover:shadow-sm"
      }`}
    >
      <span className="text-[#5C5A56]">{icon}</span>
      <span className="text-[#3D3B38]">{label}</span>
    </motion.button>
  );

  if (disabled) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{tile}</TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return tile;
}
