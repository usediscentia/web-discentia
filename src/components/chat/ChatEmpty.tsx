"use client";

import { motion } from "motion/react";
import {
  AcademicCapIcon,
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

interface ChatEmptyProps {
  onPromptClick?: (prompt: string) => void;
}

export function ChatEmpty({ onPromptClick }: ChatEmptyProps) {
  const prompts = [
    {
      icon: Square3Stack3DIcon,
      text: "Generate flashcards about...",
    },
    {
      icon: QuestionMarkCircleIcon,
      text: "Create a quiz on...",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A1A1A]">
          <AcademicCapIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-[-0.5px]">
          Start learning. Ask anything.
        </h1>
        <p className="text-[15px] text-[#9CA3AF]">
          Chat with your documents. Generate flashcards and quizzes. Review with spaced repetition.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-3"
      >
        {prompts.map((prompt) => (
          <button
            key={prompt.text}
            onClick={() => onPromptClick?.(prompt.text)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-3xl border border-[#E5E7EB] cursor-pointer hover:bg-[#F3F4F6] transition-colors"
          >
            <prompt.icon className="w-4 h-4 text-[#9CA3AF]" />
            <span className="text-[13px] font-medium text-[#6B7280]">
              {prompt.text}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
