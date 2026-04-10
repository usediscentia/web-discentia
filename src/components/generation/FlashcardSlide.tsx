"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FlashcardDraft } from "@/stores/generation.store";

interface FlashcardSlideProps {
  card: FlashcardDraft;
}

export default function FlashcardSlide({ card }: FlashcardSlideProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      onClick={() => !revealed && setRevealed(true)}
      className={`w-full h-[280px] rounded-xl bg-white border border-[#E4E3E1] shadow-sm flex flex-col items-center justify-center px-6 relative select-none ${
        !revealed ? "cursor-pointer active:scale-[0.98]" : ""
      }`}
      style={{ transition: "transform 150ms ease" }}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="front"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.55, 0, 1, 0.45] }}
            className="flex flex-col items-center justify-center text-center flex-1 w-full"
          >
            <p className="text-[15px] font-medium text-[#0C0C0C] leading-relaxed">
              {card.front}
            </p>
            <span className="absolute bottom-5 text-xs text-[#D3D1CE]">
              click to reveal
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-col items-center justify-center text-center flex-1 w-full"
          >
            <span className="absolute top-5 text-[10px] font-medium text-[#A8A5A0] tracking-widest uppercase">
              Answer
            </span>
            <p className="text-sm text-[#5C5A56] leading-relaxed">{card.back}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(false);
              }}
              className="absolute bottom-5 text-xs text-[#A8A5A0] hover:text-[#7C7974] transition-colors cursor-pointer"
            >
              click to flip back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
