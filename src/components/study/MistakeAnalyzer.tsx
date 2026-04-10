"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";

type AIVerdict = "correct" | "partial" | "incorrect";

interface SessionResult {
  card: { id?: string; front: string; back: string };
  userAnswer: string;
  verdict: AIVerdict | null;
  explanation: string;
  keyMissing: string | null;
  confidence: "unsure" | "think-so" | "certain" | null;
}

interface MistakeAnalyzerProps {
  results: SessionResult[];
}

const VERDICT_LABEL: Record<string, string> = {
  incorrect: "Errado",
  partial: "Parcial",
};

const VERDICT_STYLE: Record<string, string> = {
  incorrect: "bg-red-50 border-red-200 text-red-700",
  partial: "bg-amber-50 border-amber-200 text-amber-700",
};

function MistakeCard({ result, index }: { result: SessionResult; index: number }) {
  const [open, setOpen] = useState(false);
  const verdict = result.verdict ?? "incorrect";
  const style = VERDICT_STYLE[verdict] ?? VERDICT_STYLE.incorrect;
  const label = VERDICT_LABEL[verdict] ?? "Errado";

  return (
    <motion.div
      className="border border-gray-200 rounded-xl overflow-hidden bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index, 5) * 0.04 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${style}`}>
          {label}
        </span>
        <span className="text-sm text-gray-800 flex-1 leading-snug">{result.card.front}</span>
        {open ? <ChevronUp size={14} className="text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown size={14} className="text-gray-400 shrink-0 mt-0.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
              {result.userAnswer && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400 block mb-1">
                    Sua resposta
                  </span>
                  <p className="text-sm text-gray-500 italic">&ldquo;{result.userAnswer}&rdquo;</p>
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400 block mb-1">
                  Resposta correta
                </span>
                <p className="text-sm text-gray-700">{result.card.back}</p>
              </div>
              {result.explanation && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400 block mb-1">
                    Feedback
                  </span>
                  <p className="text-sm text-gray-600">{result.explanation}</p>
                </div>
              )}
              {result.keyMissing && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">{result.keyMissing}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MistakeAnalyzer({ results }: MistakeAnalyzerProps) {
  const mistakes = results.filter(
    (r) => r.verdict === "incorrect" || r.verdict === "partial" || r.verdict === null
  );

  if (mistakes.length === 0) return null;

  // Incorrect first, then partial
  const sorted = [
    ...mistakes.filter((r) => r.verdict === "incorrect" || r.verdict === null),
    ...mistakes.filter((r) => r.verdict === "partial"),
  ];

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.15 }}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Revisar erros · {mistakes.length} {mistakes.length === 1 ? "card" : "cards"}
      </p>
      <div className="flex flex-col gap-2">
        {sorted.map((result, i) => (
          <MistakeCard key={result.card.id ?? result.card.front + result.card.back} result={result} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
