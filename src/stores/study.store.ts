"use client";

import { create } from "zustand";
import type { SRSCard } from "@/types/srs";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import { StorageService } from "@/services/storage";
import { useProviderStore } from "@/stores/provider.store";
import { getAIProvider } from "@/services/ai";
import { buildEvaluationPrompt } from "@/services/ai/prompts/review.prompts";

type Phase = "loading" | "today" | "answering" | "evaluating" | "evaluated" | "complete";
type AIVerdict = "correct" | "partial" | "incorrect";

interface UpcomingBucket {
  label: string;
  count: number;
}

interface SessionResult {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null;
  explanation: string;
  keyMissing: string | null;
}

interface StudyState {
  // Session
  cards: SRSCard[];
  currentIndex: number;
  phase: Phase;
  results: SessionResult[];
  lastRating: ReviewRating | null;
  sessionStartTime: number;

  // Dashboard context
  streak: number;
  dueToday: number;
  reviewedToday: number;
  upcomingReviews: UpcomingBucket[];
  activeLibraryName: string | null;
  activeLibraryColor: string | null;

  // Today screen data
  totalCardsInSystem: number;
  nextSessionDate: number | null;
  nextSessionCount: number;

  // Source contexts for AI evaluation
  sourceContexts: Record<string, string>; // libraryItemId → text
  accentColors: Record<string, string>; // libraryItemId → library color hex

  // Actions
  initSession: () => Promise<void>;
  startReview: () => void;
  submitAnswer: (answer: string) => Promise<void>;
  skipCard: () => void;
  rateCard: (rating: ReviewRating) => Promise<void>;
  restartSession: () => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  // Initial state
  cards: [],
  currentIndex: 0,
  phase: "loading",
  results: [],
  lastRating: null,
  sessionStartTime: 0,

  streak: 0,
  dueToday: 0,
  reviewedToday: 0,
  upcomingReviews: [],
  activeLibraryName: null,
  activeLibraryColor: null,

  totalCardsInSystem: 0,
  nextSessionDate: null,
  nextSessionCount: 0,

  sourceContexts: {},
  accentColors: {},

  initSession: async () => {
    set({
      phase: "loading",
      cards: [],
      currentIndex: 0,
      results: [],
      lastRating: null,
      sessionStartTime: Date.now(),
      sourceContexts: {},
      accentColors: {},
      activeLibraryName: null,
      activeLibraryColor: null,
      totalCardsInSystem: 0,
      nextSessionDate: null,
      nextSessionCount: 0,
    });

    const [cards, stats, insights, totalCards, nextReview] = await Promise.all([
      StorageService.getDueCards(20),
      StorageService.getDashboardStats(),
      StorageService.getDashboardInsights(),
      StorageService.getTotalCardCount(),
      StorageService.getNextScheduledReview(),
    ]);

    const upcomingReviews: UpcomingBucket[] = insights.upcomingReviews.map(
      (r) => ({ label: r.label, count: r.dueCount })
    );

    set({
      cards,
      streak: stats.streak,
      dueToday: stats.dueToday,
      reviewedToday: stats.reviewedToday,
      upcomingReviews,
      totalCardsInSystem: totalCards,
      nextSessionDate: nextReview?.date ?? null,
      nextSessionCount: nextReview?.count ?? 0,
      phase: "today",
    });

    // Non-blocking: load source contexts and accent colors
    void (async () => {
      const contexts: Record<string, string> = {};
      const colors: Record<string, string> = {};
      let firstName: string | null = null;
      let firstColor: string | null = null;

      for (const card of cards) {
        if (!card.libraryItemId) continue;
        if (contexts[card.libraryItemId]) continue;

        try {
          const item = await StorageService.getLibraryItem(card.libraryItemId);
          if (!item) continue;

          // Build source context from chunks or content
          let text = "";
          const chunks = item.metadata?.chunks;
          if (Array.isArray(chunks) && chunks.length > 0) {
            for (const chunk of chunks) {
              const chunkText =
                chunk !== null && typeof chunk === "object" && "text" in chunk && typeof (chunk as unknown as { text: unknown }).text === "string"
                  ? (chunk as unknown as { text: string }).text
                  : "";
              if (!chunkText) continue;
              if (text.length + chunkText.length > 1500) break;
              text += (text ? "\n" : "") + chunkText;
            }
          } else {
            text = item.content.slice(0, 1500);
          }

          contexts[card.libraryItemId] = text;

          // Load library for color
          if (item.libraryId) {
            try {
              const library = await StorageService.getLibrary(item.libraryId);
              if (library) {
                colors[card.libraryItemId] = library.color;
                if (!firstName) {
                  firstName = library.name;
                  firstColor = library.color;
                }
              }
            } catch {
              // ignore library fetch errors
            }
          }
        } catch {
          // ignore item fetch errors
        }
      }

      set({
        sourceContexts: contexts,
        accentColors: colors,
        activeLibraryName: firstName,
        activeLibraryColor: firstColor,
      });
    })();
  },

  startReview: () => {
    const { cards } = get();
    if (cards.length === 0) return;
    set({ phase: "answering" });
  },

  submitAnswer: async (answer: string) => {
    if (get().phase !== "answering") return;
    const { cards, currentIndex, sourceContexts } = get();
    const card = cards[currentIndex];
    if (!card) return;

    set({ phase: "evaluating" });

    let verdict: AIVerdict;
    let explanation: string;
    let keyMissing: string | null;

    try {
      const config = useProviderStore.getState().getActiveProviderConfig();
      const provider = getAIProvider(config.type);
      if (!provider) throw new Error(`No provider found for type: ${config.type}`);

      const sourceContext = card.libraryItemId
        ? sourceContexts[card.libraryItemId]
        : undefined;

      const prompt = buildEvaluationPrompt({
        front: card.front,
        back: card.back,
        userAnswer: answer,
        sourceContext,
      });

      const raw = await new Promise<string>((resolve, reject) => {
        provider.sendMessage(
          [{ role: "user", content: prompt }],
          config,
          {
            onToken: () => {},
            onComplete: (fullText) => resolve(fullText),
            onError: (err) => reject(err),
          }
        ).catch(reject);
      });

      // Strip markdown fences before parsing
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned) as {
        verdict: AIVerdict;
        explanation: string;
        keyMissing: string | null;
      };

      const VALID_VERDICTS = ["correct", "partial", "incorrect"] as const;
      const parsedVerdict = parsed.verdict;
      verdict = VALID_VERDICTS.includes(parsedVerdict) ? parsedVerdict : "partial";
      explanation = parsed.explanation;
      keyMissing = parsed.keyMissing ?? null;
    } catch {
      verdict = answer.length > 10 ? "partial" : "incorrect";
      explanation = "Could not evaluate — check the correct answer.";
      keyMissing = null;
    }

    const result: SessionResult = {
      card,
      userAnswer: answer,
      verdict,
      explanation,
      keyMissing,
    };

    set((state) => ({
      results: [...state.results, result],
      phase: "evaluated",
    }));
  },

  skipCard: () => {
    const { cards, currentIndex } = get();
    const card = cards[currentIndex];
    if (!card) return;

    const result: SessionResult = {
      card,
      userAnswer: "",
      verdict: null,
      explanation: "",
      keyMissing: null,
    };

    set((state) => ({
      results: [...state.results, result],
      phase: "evaluated",
    }));
  },

  rateCard: async (rating: ReviewRating) => {
    if (get().phase !== "evaluated") return;
    const { cards, currentIndex } = get();
    const card = cards[currentIndex];
    if (!card) return;

    set({ lastRating: rating });

    const updated = sm2(card, rating);
    await StorageService.updateSRSCard(card.id, updated);
    await StorageService.logActivityEvent(
      "srs_review",
      "Reviewed card: " + card.front.slice(0, 40),
      { cardId: card.id, rating }
    );

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      set({ phase: "complete" });
    } else {
      set({ currentIndex: nextIndex, phase: "answering" });
    }
  },

  restartSession: async () => {
    await get().initSession();
  },
}));
