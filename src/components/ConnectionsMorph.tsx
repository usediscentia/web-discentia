"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  PuzzlePieceIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

interface SolvedGroup {
  title: string;
  items: string;
  color: string;
  bgColor: string;
  textColor: string;
}

interface ConnectionsMorphProps {
  topic?: string;
  words?: string[];
  solvedGroups?: SolvedGroup[];
  mistakesRemaining?: number;
}

export function ConnectionsMorph({
  topic = "Biology",
  words = [
    "DNA", "ATP", "Neuron", "NADH",
    "RNA", "Synapse", "Axon", "mRNA",
    "Dendrite", "FAD", "tRNA", "Glucose",
  ],
  solvedGroups = [
    {
      title: "ORGANELLES",
      items: "Golgi · Lysosome · ER · Ribosome",
      color: "#FBBF24",
      bgColor: "#FBBF2420",
      textColor: "#B45309",
    },
  ],
  mistakesRemaining = 3,
}: ConnectionsMorphProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>(["ATP", "NADH", "mRNA", "tRNA"]);

  const toggleWord = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word)
        ? prev.filter((w) => w !== word)
        : prev.length < 4
        ? [...prev, word]
        : prev
    );
  };

  const rows = [];
  for (let i = 0; i < words.length; i += 4) {
    rows.push(words.slice(i, i + 4));
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <PuzzlePieceIcon className="w-4 h-4 text-[#6B7280]" />
        <span className="text-[13px] font-medium text-[#6B7280]">
          Connections · {topic}
        </span>
        <ArrowsPointingInIcon className="w-3.5 h-3.5 text-[#9CA3AF] cursor-pointer" />
      </div>

      {solvedGroups.map((group) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1 w-full py-3.5 rounded-xl"
          style={{ backgroundColor: group.bgColor }}
        >
          <span
            className="text-xs font-bold tracking-[1px]"
            style={{ color: group.textColor }}
          >
            {group.title}
          </span>
          <span
            className="text-[13px] font-medium"
            style={{ color: group.textColor }}
          >
            {group.items}
          </span>
        </motion.div>
      ))}

      <div className="flex flex-col gap-2 w-full">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 w-full">
            {row.map((word) => {
              const isSelected = selectedWords.includes(word);
              return (
                <motion.button
                  key={word}
                  onClick={() => toggleWord(word)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: rowIndex * 0.1 }}
                  className={`flex-1 flex items-center justify-center h-14 rounded-[10px] cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#F3F4F6] text-[#1A1A1A] hover:bg-[#E5E7EB]"
                  }`}
                >
                  <span className="text-sm font-semibold">{word}</span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#6B7280]">
            Mistakes remaining:
          </span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < mistakesRemaining ? "bg-[#1A1A1A]" : "bg-[#E5E7EB]"
              }`}
            />
          ))}
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 rounded-3xl bg-[#1A1A1A] cursor-pointer hover:bg-[#333] transition-colors">
          <span className="text-sm font-semibold text-white">Submit</span>
        </button>
      </div>
    </div>
  );
}
