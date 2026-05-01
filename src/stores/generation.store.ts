"use client";

import { create } from "zustand";

export type GenerationStep = "configure" | "generating" | "review" | "schedule" | "success" | "error";
export type ExerciseGenerationType = "flashcards" | "quiz" | "sprint" | "connections";

export interface FlashcardDraft {
  id: string;
  front: string;
  back: string;
}

interface GenerationState {
  // Modal state
  isOpen: boolean;
  step: GenerationStep;
  exerciseType: ExerciseGenerationType;
  documentId: string | null;
  documentTitle: string;

  // Configure
  focusPrompt: string;
  cardCount: number;

  // Generating
  generatedCards: FlashcardDraft[];
  generationProgress: number;
  currentGeneratingIndex: number;

  // Review
  removedCardIds: Set<string>;
  editingCardId: string | null;

  // Schedule
  targetDate: Date | null;
  savedCardIds: string[]; // IDs of cards saved to DB (for distribution)

  // Error
  errorMessage: string | null;

  // Actions
  open: (documentId: string, documentTitle: string, type: ExerciseGenerationType) => void;
  close: () => void;
  setStep: (step: GenerationStep) => void;
  setError: (message: string) => void;
  setFocusPrompt: (prompt: string) => void;
  setCardCount: (count: number) => void;
  setGeneratedCards: (cards: FlashcardDraft[]) => void;
  setGenerationProgress: (progress: number, index: number) => void;
  removeCard: (id: string) => void;
  updateCard: (id: string, front: string, back: string) => void;
  setEditingCard: (id: string | null) => void;
  setTargetDate: (date: Date | null) => void;
  setSavedCardIds: (ids: string[]) => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  step: "configure" as GenerationStep,
  exerciseType: "flashcards" as ExerciseGenerationType,
  documentId: null as string | null,
  documentTitle: "",
  focusPrompt: "",
  cardCount: 5,
  generatedCards: [] as FlashcardDraft[],
  generationProgress: 0,
  currentGeneratingIndex: 0,
  removedCardIds: new Set<string>(),
  editingCardId: null as string | null,
  targetDate: null as Date | null,
  savedCardIds: [] as string[],
  errorMessage: null as string | null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  open: (documentId, documentTitle, type) =>
    set((state) => ({
      isOpen: true,
      step: "configure",
      exerciseType: type,
      documentId,
      documentTitle,
      // Preserve focusPrompt and cardCount from previous open
      focusPrompt: state.documentId === documentId ? state.focusPrompt : "",
      cardCount: state.cardCount,
      generatedCards: [],
      generationProgress: 0,
      currentGeneratingIndex: 0,
      removedCardIds: new Set(),
      editingCardId: null,
      errorMessage: null,
    })),

  close: () => set({ isOpen: false }),

  setStep: (step) => set({ step }),

  setError: (errorMessage) => set({ errorMessage, step: "error" }),

  setFocusPrompt: (focusPrompt) => set({ focusPrompt }),

  setCardCount: (cardCount) => set({ cardCount }),

  setGeneratedCards: (generatedCards) => set({ generatedCards }),

  setGenerationProgress: (generationProgress, currentGeneratingIndex) =>
    set({ generationProgress, currentGeneratingIndex }),

  removeCard: (id) =>
    set((state) => {
      const next = new Set(state.removedCardIds);
      next.add(id);
      return { removedCardIds: next, editingCardId: null };
    }),

  updateCard: (id, front, back) =>
    set((state) => ({
      generatedCards: state.generatedCards.map((c) =>
        c.id === id ? { ...c, front, back } : c
      ),
      editingCardId: null,
    })),

  setEditingCard: (editingCardId) => set({ editingCardId }),

  setTargetDate: (targetDate) => set({ targetDate }),

  setSavedCardIds: (savedCardIds) => set({ savedCardIds }),

  reset: () => set(initialState),
}));
