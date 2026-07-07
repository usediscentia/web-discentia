"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { Deck } from "@/types/deck";

// Placeholder — issue 04 replaces with card CRUD + sources + chat.
export default function DeckDetailPage({ deckId }: { deckId: string }) {
  const closeDeck = useAppStore((s) => s.closeDeck);
  const [deck, setDeck] = useState<Deck | null>(null);

  useEffect(() => {
    StorageService.getDeck(deckId).then((d) => setDeck(d ?? null));
  }, [deckId]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <button
        onClick={closeDeck}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft size={16} />
        Decks
      </button>
      <h1 className="text-2xl font-semibold text-foreground">
        {deck ? deck.name : "…"}
      </h1>
      {deck && (
        <p className="mt-1 text-sm text-muted-foreground">
          {deck.cardCount} cards
        </p>
      )}
    </div>
  );
}
