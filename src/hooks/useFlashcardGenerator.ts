import { useState, useRef } from "react";
import type { LibraryItem } from "@/types/library";
import { buildContextSnippet } from "@/lib/tokens";
import { buildFlashcardPrompt } from "@/services/ai/prompts/exercise.prompts";
import { parseExerciseFromResponse } from "@/services/ai/parsers/exercise.parser";
import { getAIProvider } from "@/services/ai";
import { useProviderStore } from "@/stores/provider.store";
import type { FlashcardData } from "@/types/exercise";

export interface EditableCard {
  id: string;
  front: string;
  back: string;
}

interface UseFlashcardGeneratorReturn {
  cards: EditableCard[];
  setCards: React.Dispatch<React.SetStateAction<EditableCard[]>>;
  isLoading: boolean;
  streamingText: string;
  error: string | null;
  generate: (prompt: string, count: number) => Promise<void>;
  reset: () => void;
}

export function useFlashcardGenerator(item: LibraryItem): UseFlashcardGeneratorReturn {
  const [cards, setCards] = useState<EditableCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const reset = () => {
    setCards([]);
    setStreamingText("");
    setError(null);
  };

  const generate = async (prompt: string, count: number) => {
    setIsLoading(true);
    setError(null);
    setCards([]);
    setStreamingText("");

    const config = useProviderStore.getState().getActiveProviderConfig();
    const provider = getAIProvider(config.type);

    if (!provider) {
      setError("No AI provider available.");
      setIsLoading(false);
      return;
    }

    // Build context from item chunks (or full content if no chunks)
    const chunks = item.metadata.chunks ?? [];
    const scoredItem = {
      item,
      score: 1,
      matchedChunks: chunks.map((chunk) => ({ chunk, chunkScore: 1 })),
    };
    const { contextText } = buildContextSnippet([scoredItem], 4000);

    const fullPrompt = buildFlashcardPrompt(prompt, contextText || undefined, count);

    let accumulated = "";

    const sendPromise = provider.sendMessage(
      [{ role: "user", content: fullPrompt }],
      config,
      {
        onToken: (token) => {
          accumulated += token;
          setStreamingText(accumulated);
        },
        onComplete: (fullText) => {
          const exercise = parseExerciseFromResponse(fullText, "");
          if (exercise && exercise.type === "flashcard") {
            const data = exercise.data as FlashcardData;
            setCards(
              data.cards.map((c) => ({ id: c.id, front: c.front, back: c.back }))
            );
          } else {
            setError("Could not parse flashcards from AI response. Try again.");
          }
          setStreamingText("");
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setStreamingText("");
          setIsLoading(false);
        },
      }
    );

    // Store abort capability via the promise rejection path
    abortRef.current = () => sendPromise.catch(() => {/* silenced */});

    await sendPromise.catch((err: Error) => {
      if (err?.name !== "AbortError") {
        setError(err.message ?? "Generation failed.");
      }
      setIsLoading(false);
    });
  };

  return { cards, setCards, isLoading, streamingText, error, generate, reset };
}
