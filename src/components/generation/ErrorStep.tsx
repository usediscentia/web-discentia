"use client";

import { motion } from "motion/react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStepProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorStep({ message, onRetry }: ErrorStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.12, ease: [0.55, 0, 1, 0.45] } }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center py-8 gap-5 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-500" />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold text-[#0C0C0C]">Generation failed</p>
        <p className="text-[13px] text-[#A8A5A0] max-w-[280px] leading-relaxed">{message}</p>
      </div>

      <Button
        onClick={onRetry}
        className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium cursor-pointer"
        style={{ backgroundColor: "var(--brand)", color: "var(--brand-foreground)" }}
      >
        <RotateCcw size={14} />
        Try again
      </Button>
    </motion.div>
  );
}
