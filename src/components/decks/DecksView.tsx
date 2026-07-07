"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { Deck } from "@/types/deck";

// Placeholder — issue 03 replaces with full grid + CRUD.
export default function DecksView() {
  const openDeck = useAppStore((s) => s.openDeck);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    StorageService.listDecks().then(setDecks);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Decks</h1>
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Layers size={32} />
          <p className="text-sm">Nenhum deck ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => openDeck(deck.id)}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/60 cursor-pointer"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: deck.color }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {deck.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {deck.cardCount} cards
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
