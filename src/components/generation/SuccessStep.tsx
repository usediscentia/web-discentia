"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5"
      >
        <Check size={28} className="text-green-600" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-medium text-[#0C0C0C]"
      >
        {cardCount} card{cardCount !== 1 ? "s" : ""} added
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[#7C7974] mt-1"
      >
        to your deck
      </motion.p>
    </motion.div>
  );
}
