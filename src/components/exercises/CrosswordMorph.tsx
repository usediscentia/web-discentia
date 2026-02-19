"use client";

import { motion } from "motion/react";
import {
  Squares2X2Icon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

interface CrosswordCell {
  letter?: string;
  number?: number;
  empty?: boolean;
  highlighted?: boolean;
}

interface Clue {
  number: number;
  text: string;
}

interface CrosswordMorphProps {
  topic?: string;
  grid?: CrosswordCell[][];
  acrossClues?: Clue[];
  downClues?: Clue[];
}

const defaultGrid: CrosswordCell[][] = [
  [
    { empty: true },
    { letter: "C", number: 1 },
    { letter: "E" },
    { letter: "L" },
    { letter: "L" },
    { empty: true },
    { empty: true },
  ],
  [
    { empty: true },
    { empty: true },
    { empty: true },
    { letter: "Y", highlighted: true },
    { empty: true },
    { empty: true },
    { empty: true },
  ],
  [
    { empty: true },
    { empty: true },
    { empty: true },
    { letter: "S" },
    { empty: true },
    { empty: true },
    { empty: true },
  ],
  [
    { letter: "D", number: 2 },
    { letter: "N" },
    { letter: "A" },
    { letter: "O", number: 3 },
    { empty: true },
    { empty: true },
    { empty: true },
  ],
  [
    { empty: true },
    { empty: true },
    { empty: true },
    { letter: "S" },
    { empty: true },
    { empty: true },
    { empty: true },
  ],
];

export function CrosswordMorph({
  topic = "Biology 101",
  grid = defaultGrid,
  acrossClues = [
    { number: 1, text: "Basic unit of life" },
    { number: 2, text: "Carries genetic information (abbr.)" },
  ],
  downClues = [
    { number: 1, text: "Organelle breakdown center" },
    { number: 3, text: "Cell internal fluid" },
  ],
}: CrosswordMorphProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <Squares2X2Icon className="w-4 h-4 text-[#6B7280]" />
        <span className="text-[13px] font-medium text-[#6B7280]">
          Crossword · {topic}
        </span>
        <ArrowsPointingInIcon className="w-3.5 h-3.5 text-[#9CA3AF] cursor-pointer" />
      </div>

      <div className="flex flex-col gap-8 w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    delay: (rowIndex * row.length + colIndex) * 0.03,
                  }}
                  className={`flex items-center justify-center w-10 h-10 relative ${
                    cell.empty
                      ? "bg-[#F3F4F6]"
                      : cell.highlighted
                      ? "bg-[#EBF5FF] border border-[#E5E7EB]"
                      : "border border-[#E5E7EB]"
                  }`}
                >
                  {cell.number && (
                    <span className="absolute top-0.5 left-1 text-[8px] font-bold text-[#9CA3AF]">
                      {cell.number}
                    </span>
                  )}
                  {cell.letter && (
                    <span className="text-sm font-semibold text-[#1A1A1A]">
                      {cell.letter}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold text-[#1A1A1A]">Across</h4>
            {acrossClues.map((clue) => (
              <div key={clue.number} className="flex gap-2 w-full">
                <span className="text-[13px] font-bold text-[#9CA3AF] w-5 shrink-0">
                  {clue.number}.
                </span>
                <span className="text-[13px] text-[#6B7280]">{clue.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold text-[#1A1A1A]">Down</h4>
            {downClues.map((clue) => (
              <div key={clue.number} className="flex gap-2 w-full">
                <span className="text-[13px] font-bold text-[#9CA3AF] w-5 shrink-0">
                  {clue.number}.
                </span>
                <span className="text-[13px] text-[#6B7280]">{clue.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
