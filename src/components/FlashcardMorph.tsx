"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Square3Stack3DIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface FlashcardMorphProps {
  topic?: string;
  question?: string;
  answer?: string;
  current?: number;
  total?: number;
}

export function FlashcardMorph({
  topic = "Cell Biology",
  question = "What is the powerhouse\nof the cell?",
  answer = "The mitochondria is the powerhouse of the cell, responsible for producing ATP through cellular respiration.",
  current = 3,
  total = 15,
}: FlashcardMorphProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Square3Stack3DIcon className="w-4 h-4 text-[#6B7280]" />
        <span className="text-[13px] font-medium text-[#6B7280]">
          Flashcards · {topic}
        </span>
        <ArrowsPointingInIcon className="w-3.5 h-3.5 text-[#9CA3AF] cursor-pointer" />
      </div>

      <motion.div
        className="flex flex-col items-center justify-center gap-4 w-full h-[280px] bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] p-8 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <h2 className="text-[22px] font-semibold text-[#1A1A1A] tracking-[-0.3px] leading-[1.3] text-center whitespace-pre-wrap">
                {question}
              </h2>
              <p className="text-[13px] text-[#9CA3AF]">Tap to reveal answer</p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-base text-[#1A1A1A] text-center leading-relaxed">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-3xl bg-[#F3F4F6]">
          <ArrowPathIcon className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Flip Card
          </span>
        </div>
      </motion.div>

      <div className="flex items-center justify-between w-full">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-3xl border border-[#FCA5A5] cursor-pointer hover:bg-red-50 transition-colors">
          <XMarkIcon className="w-3.5 h-3.5 text-[#EF4444]" />
          <span className="text-[13px] font-medium text-[#EF4444]">
            Didn&apos;t know
          </span>
        </button>

        <span className="text-sm font-semibold text-[#6B7280]">
          {current} / {total}
        </span>

        <button className="flex items-center gap-2 px-5 py-2.5 rounded-3xl border border-[#86EFAC] cursor-pointer hover:bg-green-50 transition-colors">
          <CheckIcon className="w-3.5 h-3.5 text-[#22C55E]" />
          <span className="text-[13px] font-medium text-[#22C55E]">
            Knew it
          </span>
        </button>
      </div>

      <div className="w-full h-1 bg-[#F3F4F6] rounded-sm overflow-hidden">
        <motion.div
          className="h-full bg-[#1A1A1A] rounded-sm"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
