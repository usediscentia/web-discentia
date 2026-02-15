"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ClipboardDocumentListIcon,
  ArrowsPointingInIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface QuizAnswer {
  label: string;
  text: string;
  correct?: boolean;
}

interface QuizMorphProps {
  topic?: string;
  question?: string;
  answers?: QuizAnswer[];
  current?: number;
  total?: number;
}

export function QuizMorph({
  topic = "Cell Biology",
  question = "Which organelle is responsible\nfor protein synthesis?",
  answers = [
    { label: "A", text: "Mitochondria" },
    { label: "B", text: "Ribosome", correct: true },
    { label: "C", text: "Nucleus" },
    { label: "D", text: "Golgi apparatus" },
  ],
  current = 5,
  total = 10,
}: QuizMorphProps) {
  const [selected, setSelected] = useState<string | null>("B");

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <ClipboardDocumentListIcon className="w-4 h-4 text-[#6B7280]" />
        <span className="text-[13px] font-medium text-[#6B7280]">
          Quiz · {topic}
        </span>
        <ArrowsPointingInIcon className="w-3.5 h-3.5 text-[#9CA3AF] cursor-pointer" />
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-1 bg-[#F3F4F6] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-[#1A1A1A] rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[13px] font-semibold text-[#6B7280]">
          {current} / {total}
        </span>
      </div>

      <div className="flex flex-col gap-5 w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-lg font-semibold text-[#1A1A1A] tracking-[-0.2px] leading-[1.4] whitespace-pre-wrap">
          {question}
        </h3>

        <div className="flex flex-col gap-2.5 w-full">
          {answers.map((answer) => {
            const isSelected = selected === answer.label;
            const isCorrect = answer.correct && isSelected;

            return (
              <motion.button
                key={answer.label}
                onClick={() => setSelected(answer.label)}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between gap-3 w-full px-[18px] py-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isCorrect
                    ? "bg-[#F0FDF4] border-[#86EFAC] border-2"
                    : isSelected
                    ? "bg-[#FEF2F2] border-[#FCA5A5] border-2"
                    : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-[#9CA3AF]">
                    {answer.label}
                  </span>
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {answer.text}
                  </span>
                </div>
                {isCorrect && (
                  <CheckIcon className="w-[18px] h-[18px] text-[#22C55E]" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
