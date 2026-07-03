"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { StorageService, type DeckWithCounts } from "@/services/storage";
import { useStudyStore } from "@/stores/study.store";
import { DeckCard } from "./DeckCard";

export function DeckGrid() {
  const [decks, setDecks] = useState<DeckWithCounts[]>([]);

  useEffect(() => {
    StorageService.listDecksWithCounts().then(setDecks);
  }, []);

  if (decks.length === 0) return null;

  const startCram = async (deckId: string, weakestOnly = false) => {
    const { initSession, startReview } = useStudyStore.getState();
    await initSession({ deckId, weakestOnly });
    startReview();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-8 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={14} className="text-[#9C9690]" />
        <h2 className="text-[13px] font-semibold text-[#1A1814]">Decks</h2>
        <span className="text-[11px] text-[#9C9690]">{decks.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onCram={() => startCram(deck.id)}
            onWeakestCram={() => startCram(deck.id, true)}
          />
        ))}
      </div>
    </div>
  );
}
