"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb } from "lucide-react";

interface HintLadderProps {
  answer: string;
}

function buildHints(answer: string): [string, string, string] {
  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;
  const firstLetter = words[0]?.[0]?.toUpperCase() ?? "?";

  // Hint 1: count + first letter
  const hint1 = `${wordCount} ${wordCount === 1 ? "word" : "words"} · starts with "${firstLetter}"`;

  // Hint 2: blanked — show first letter of each word, underscores for the rest
  const hint2 = words
    .map((w) => {
      if (w.length <= 1) return w;
      return w[0] + "_".repeat(Math.max(1, w.length - 1));
    })
    .join(" ");

  // Hint 3: first 40% of full answer revealed, rest blanked char-by-char
  const cutoff = Math.max(1, Math.floor(answer.length * 0.4));
  const hint3 = answer.slice(0, cutoff) + answer.slice(cutoff).replace(/[^\s]/g, "·");

  return [hint1, hint2, hint3];
}

const HINT_LABELS = ["Nível 1", "Nível 2", "Nível 3"];
const HINT_COLORS = [
  "text-amber-600 border-amber-200 bg-amber-50",
  "text-orange-600 border-orange-200 bg-orange-50",
  "text-red-600 border-red-200 bg-red-50",
];

export function HintLadder({ answer }: HintLadderProps) {
  const [level, setLevel] = useState(0); // 0 = no hint shown

  const hints = buildHints(answer);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <AnimatePresence initial={false}>
        {level > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              key={level}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`rounded-lg border px-3 py-2 text-sm font-mono ${HINT_COLORS[level - 1]}`}
            >
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider opacity-60 block mb-0.5">
                Dica {HINT_LABELS[level - 1]}
              </span>
              {hints[level - 1]}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {level < 3 && (
        <motion.button
          onClick={() => setLevel((l) => l + 1)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors cursor-pointer self-start"
          whileTap={{ scale: 0.97 }}
        >
          <Lightbulb size={12} />
          {level === 0 ? "Ver dica" : "Próxima dica"}
        </motion.button>
      )}
    </div>
  );
}
