"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Flame,
  FolderInput,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { StorageService, type DeckWithCounts } from "@/services/storage";
import type { SRSCard } from "@/types/srs";
import { useStudyStore } from "@/stores/study.store";

function weakColor(score: number): string {
  return score > 0.6 ? "#F87171" : "#FBBF24";
}

interface DeckDetailProps {
  deckId: string;
  onBack: () => void;
}

export function DeckDetail({ deckId, onBack }: DeckDetailProps) {
  const [deck, setDeck] = useState<DeckWithCounts | null>(null);
  const [allDecks, setAllDecks] = useState<DeckWithCounts[]>([]);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [query, setQuery] = useState("");

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [adding, setAdding] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const refresh = useCallback(() => {
    return Promise.all([
      StorageService.listDecksWithCounts(),
      StorageService.searchCards({ query, deckId, limit: 1000 }),
    ]).then(([decks, results]) => {
      setAllDecks(decks);
      setDeck(decks.find((d) => d.id === deckId) ?? null);
      setCards(results);
      setLoadedAt(Date.now());
    });
  }, [deckId, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!deck) return null;

  const saveRename = async () => {
    const name = nameDraft.trim();
    setRenaming(false);
    if (!name || name === deck.name) return;
    await StorageService.renameDeck(deck.id, name);
    await refresh();
  };

  const deleteDeck = async () => {
    const confirmed = window.confirm(
      deck.cardCount > 0
        ? `Excluir "${deck.name}"? ${deck.cardCount} ${deck.cardCount === 1 ? "card será excluído" : "cards serão excluídos"} junto com o deck.`
        : `Excluir "${deck.name}"?`
    );
    if (!confirmed) return;
    await StorageService.deleteDeck(deck.id);
    onBack();
  };

  const addCard = async () => {
    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) return;
    await StorageService.createCard({ deckId: deck.id, front, back });
    setNewFront("");
    setNewBack("");
    await refresh();
  };

  const startEdit = (card: SRSCard) => {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const front = editFront.trim();
    const back = editBack.trim();
    setEditingId(null);
    if (!front || !back) return;
    await StorageService.updateCard(editingId, { front, back });
    await refresh();
  };

  const moveCard = async (cardId: string, targetDeckId: string) => {
    await StorageService.moveCard(cardId, targetDeckId);
    setEditingId(null);
    await refresh();
  };

  const deleteCard = async (card: SRSCard) => {
    const confirmed = window.confirm(
      `Excluir o card "${card.front.slice(0, 60)}"?`
    );
    if (!confirmed) return;
    await StorageService.deleteCard(card.id);
    await refresh();
  };

  const startCram = async () => {
    const { initSession, startReview } = useStudyStore.getState();
    await initSession({ deckId: deck.id });
    startReview();
  };

  const otherDecks = allDecks.filter((d) => d.id !== deck.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="w-full max-w-3xl mx-auto px-8 py-8"
    >
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-[#9C9690] cursor-pointer transition-colors hover:text-[#6B6560] mb-4"
      >
        <ArrowLeft size={13} />
        Decks
      </button>

      <div className="flex items-start justify-between gap-3 mb-1">
        {renaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={saveRename}
            className="flex-1 bg-transparent text-[20px] font-semibold text-[#1A1814] outline-none border-b border-[#D8D4CE]"
          />
        ) : (
          <h1
            onClick={() => {
              setNameDraft(deck.name);
              setRenaming(true);
            }}
            title="Clique para renomear"
            className="text-[20px] font-semibold text-[#1A1814] cursor-text"
          >
            {deck.name}
          </h1>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {deck.cardCount > 0 && (
            <button
              onClick={startCram}
              className="flex items-center gap-1.5 rounded-full bg-[#1A1814] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer transition-opacity hover:opacity-85"
            >
              <Play size={11} />
              Estudar
            </button>
          )}
          <button
            onClick={deleteDeck}
            title="Excluir deck"
            className="flex items-center justify-center rounded-full p-2 text-[#9C9690] cursor-pointer transition-colors hover:text-[#F87171] hover:bg-[#F8717110]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[12px] text-[#9C9690] mb-6">
        <span>
          {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
        </span>
        {deck.dueCount > 0 && (
          <span className="font-medium text-emerald-600">
            {deck.dueCount} {deck.dueCount === 1 ? "pendente" : "pendentes"}
          </span>
        )}
        {deck.weakScore > 0.35 && (
          <span
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: weakColor(deck.weakScore),
              background: `${weakColor(deck.weakScore)}1A`,
            }}
          >
            <Flame size={10} />
            {Math.round(deck.weakScore * 100)}% fraco
          </span>
        )}
      </div>

      {/* Search + add */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-[#E8E5E0] bg-white px-3 py-2">
          <Search size={13} className="text-[#C8C4BE] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Buscar cards — use "aspas" para frase exata'}
            className="w-full bg-transparent text-[13px] text-[#1A1814] placeholder:text-[#C8C4BE] outline-none"
          />
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12px] font-medium cursor-pointer transition-colors ${
            adding
              ? "border-[#1A1814] bg-[#1A1814] text-white"
              : "border-[#E8E5E0] bg-white text-[#6B6560] hover:border-[#D8D4CE]"
          }`}
        >
          <Plus size={13} />
          Novo card
        </button>
      </div>

      {/* Add card form */}
      {adding && (
        <div className="flex flex-col gap-2 rounded-[12px] border border-[#D8D4CE] bg-white p-4 mb-4">
          <textarea
            autoFocus
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Frente (pergunta)"
            rows={2}
            className="w-full resize-none bg-transparent text-[13px] font-medium text-[#1A1814] placeholder:text-[#C8C4BE] placeholder:font-normal outline-none"
          />
          <div className="h-px bg-[#F0EDE8]" />
          <textarea
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Verso (resposta)"
            rows={2}
            className="w-full resize-none bg-transparent text-[13px] text-[#1A1814] placeholder:text-[#C8C4BE] outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setAdding(false);
                setNewFront("");
                setNewBack("");
              }}
              className="rounded-[8px] px-3 py-1.5 text-[12px] text-[#9C9690] cursor-pointer transition-colors hover:text-[#6B6560]"
            >
              Cancelar
            </button>
            <button
              onClick={addCard}
              disabled={!newFront.trim() || !newBack.trim()}
              className="rounded-[8px] bg-[#1A1814] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-default"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Card list */}
      {cards.length === 0 ? (
        <p className="text-[12px] text-[#9C9690] py-8 text-center">
          {query.trim()
            ? "Nenhum card encontrado para essa busca."
            : "Deck vazio. Adicione um card ou gere flashcards a partir de um documento."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map((card) =>
            editingId === card.id ? (
              <div
                key={card.id}
                className="flex flex-col gap-2 rounded-[12px] border border-[#D8D4CE] bg-white p-4"
              >
                <textarea
                  autoFocus
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent text-[13px] font-medium text-[#1A1814] outline-none"
                />
                <div className="h-px bg-[#F0EDE8]" />
                <textarea
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent text-[13px] text-[#1A1814] outline-none"
                />
                <div className="flex items-center gap-2">
                  {otherDecks.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9C9690]">
                      <FolderInput size={12} />
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) moveCard(card.id, e.target.value);
                        }}
                        className="bg-transparent text-[11px] text-[#6B6560] outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Mover para...
                        </option>
                        {otherDecks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={() => deleteCard(card)}
                    title="Excluir card"
                    className="flex items-center justify-center rounded-[8px] p-1.5 text-[#9C9690] cursor-pointer transition-colors hover:text-[#F87171]"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-[8px] px-3 py-1.5 text-[12px] text-[#9C9690] cursor-pointer transition-colors hover:text-[#6B6560]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!editFront.trim() || !editBack.trim()}
                      className="rounded-[8px] bg-[#1A1814] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-default"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                key={card.id}
                onClick={() => startEdit(card)}
                className="group flex flex-col gap-1 rounded-[12px] border border-[#E8E5E0] bg-white p-4 text-left cursor-pointer transition-colors hover:border-[#D8D4CE] hover:bg-[#FAFAF8]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#1A1814]">
                    {card.front}
                  </span>
                  {card.nextReviewDate <= loadedAt && (
                    <span
                      title="Pendente para revisão"
                      className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500"
                    />
                  )}
                </div>
                <span className="text-[12px] text-[#9C9690] line-clamp-2">
                  {card.back}
                </span>
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
