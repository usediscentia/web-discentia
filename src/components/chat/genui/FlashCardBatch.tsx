"use client";

import { useState } from "react";
import { StorageService } from "@/services/storage";

interface FlashCardBatchProps {
  props: {
    cards: { question: string; answer: string }[];
    deckName: string;
  };
}

export function FlashCardBatch({ props }: FlashCardBatchProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await StorageService.createSRSCards(
        props.cards.map((c) => ({ front: c.question, back: c.answer }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 max-w-sm">
      {props.cards.map((card, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">{card.question}</p>
          <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{card.answer}</p>
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-default disabled:opacity-50"
      >
        {saved
          ? "✓ Adicionado ao deck"
          : saving
          ? "Salvando..."
          : `Adicionar ao deck "${props.deckName}"`}
      </button>
    </div>
  );
}
