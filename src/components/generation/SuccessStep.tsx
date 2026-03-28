"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

interface SuccessStepProps {
  cardCount: number;
  onAutoClose: () => void;
}

export default function SuccessStep({ cardCount, onAutoClose }: SuccessStepProps) {
  useEffect(() => {
    const timer = setTimeout(onAutoClose, 1500);
    return () => clearTimeout(timer);
  }, [onAutoClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-center py-10"
    >
      {/* Display number */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-[88px] font-bold leading-none text-[#0C0C0C] tracking-tight"
      >
        {cardCount}
      </motion.p>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="text-[15px] text-[#7C7974] mt-2 mb-8"
      >
        {cardCount === 1 ? "card added to your deck" : "cards added to your deck"}
      </motion.p>

      {/* Green pill */}
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="text-xs font-medium bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1.5"
      >
        Review starts tomorrow
      </motion.span>
    </motion.div>
  );
}
