"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lightbulb, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HintLadderProps {
  answer: string;
}

function buildHints(answer: string): [string, string, string] {
  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;
  const firstLetter = words[0]?.[0]?.toUpperCase() ?? "?";

  const hint1 = `${wordCount} ${wordCount === 1 ? "word" : "words"} · starts with "${firstLetter}"`;

  const hint2 = words
    .map((w) => {
      if (w.length <= 1) return w;
      return w[0] + "_".repeat(Math.max(1, w.length - 1));
    })
    .join(" ");

  const cutoff = Math.max(1, Math.floor(answer.length * 0.4));
  const hint3 = answer.slice(0, cutoff) + answer.slice(cutoff).replace(/[^\s]/g, "·");

  return [hint1, hint2, hint3];
}

const LEVEL_COLORS = [
  "text-amber-700 bg-amber-50 border-amber-200",
  "text-orange-700 bg-orange-50 border-orange-200",
  "text-red-700 bg-red-50 border-red-200",
];

const HINT_TEXT_COLORS = [
  "text-amber-800",
  "text-orange-800",
  "text-red-800",
];

export function HintLadder({ answer }: HintLadderProps) {
  const [level, setLevel] = useState(0);
  const hints = buildHints(answer);

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Expand/collapse hint panel */}
      <AnimatePresence initial={false}>
        {level > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className={`rounded-lg border px-3 py-2.5 ${LEVEL_COLORS[level - 1]}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge
                  variant="secondary"
                  className={`text-[10px] uppercase tracking-wider font-medium border px-1.5 py-0 h-auto ${LEVEL_COLORS[level - 1]}`}
                >
                  Dica {level}
                </Badge>
                {level < 3 && (
                  <motion.button
                    onClick={() => setLevel((l) => l + 1)}
                    className="flex items-center gap-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    whileTap={{ scale: 0.97 }}
                  >
                    Próxima
                    <ChevronRight size={11} />
                  </motion.button>
                )}
              </div>

              {/* Crossfade between levels */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={level}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`font-mono text-sm leading-relaxed ${HINT_TEXT_COLORS[level - 1]}`}
                >
                  {hints[level - 1]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      {level === 0 && (
        <motion.button
          onClick={() => setLevel(1)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 transition-colors cursor-pointer self-start"
          whileTap={{ scale: 0.97 }}
        >
          <Lightbulb size={11} />
          Ver dica
        </motion.button>
      )}
    </div>
  );
}
