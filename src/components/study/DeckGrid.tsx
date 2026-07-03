"use client";

import { useEffect, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { StorageService, type DeckWithCounts } from "@/services/storage";
import { useStudyStore } from "@/stores/study.store";
import { DeckCard } from "./DeckCard";

export function DeckGrid() {
  const [decks, setDecks] = useState<DeckWithCounts[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    StorageService.listDecksWithCounts().then(setDecks);
  }, []);

  if (decks.length === 0) return null;

  const createDeck = async () => {
    const name = newName.trim();
    setCreating(false);
    setNewName("");
    if (!name) return;
    await StorageService.createDeck(name);
    setDecks(await StorageService.listDecksWithCounts());
  };

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
        {creating ? (
          <div className="flex items-center rounded-[12px] border border-[#D8D4CE] bg-white p-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createDeck();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewName("");
                }
              }}
              onBlur={createDeck}
              placeholder="Nome do deck"
              className="w-full bg-transparent text-[13px] font-semibold text-[#1A1814] placeholder:text-[#C8C4BE] placeholder:font-normal outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#D8D4CE] p-4 text-[12px] font-medium text-[#9C9690] cursor-pointer transition-colors hover:border-[#C8C4BE] hover:text-[#6B6560] hover:bg-[#FAFAF8]"
          >
            <Plus size={13} />
            Novo deck
          </button>
        )}
      </div>
    </div>
  );
}
