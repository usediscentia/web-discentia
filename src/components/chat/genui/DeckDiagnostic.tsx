"use client";

import { useAppStore } from "@/stores/app.store";

interface DeckDiagnosticProps {
  props: {
    decks: { name: string; overdueCards: number; retentionRate: number }[];
  };
}

export function DeckDiagnostic({ props }: DeckDiagnosticProps) {
  const { setActiveView } = useAppStore();
  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 max-w-xs">
      {props.decks.map((deck, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{deck.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {deck.overdueCards} atrasados · {deck.retentionRate}% retenção
            </p>
          </div>
          <button
            onClick={() => setActiveView("study")}
            className="cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Revisar
          </button>
        </div>
      ))}
    </div>
  );
}
