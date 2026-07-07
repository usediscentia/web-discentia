import { StorageService } from "@/services/storage";
import {
  buildContextSnippet,
  DEFAULT_CONTEXT_TOKEN_BUDGET,
  estimateTokenCountFromChars,
} from "@/lib/tokens";
import { buildExercisePrompt } from "@/services/ai/prompts/exercise.prompts";
import { openuiLibrary, openuiPromptOptions } from "@/services/ai/openui";
import { SYSTEM_PROMPT } from "@/lib/constants";
import type { AIMessage } from "@/types/ai";
import type { ExerciseType } from "@/types/exercise";
import type { InjectedChunk } from "@/lib/tokens";

export interface ChatContext {
  aiMessages: AIMessage[];
  injectedChunks: InjectedChunk[];
}

export async function buildChatContext(
  content: string,
  deckIds: string[],
  historyMessages: Array<{ role: string; content: string }>,
  exerciseIntent: { type: ExerciseType; topic: string } | null
): Promise<ChatContext> {
  const relevantItems = deckIds.length
    ? await StorageService.searchDeckSources({
        query: content,
        deckIds,
        limit: 24,
      })
    : [];

  const { contextText, injectedChunks } = buildContextSnippet(
    relevantItems,
    DEFAULT_CONTEXT_TOKEN_BUDGET
  );
  const contextTokenEstimate = estimateTokenCountFromChars(contextText.length);

  const statsPromise = !exerciseIntent
    ? Promise.all([
        StorageService.getDashboardStats(),
        StorageService.getDashboardInsights(),
      ])
        .then(([stats, insights]) =>
          [
            "USER STUDY STATS (real-time data from local database — use these exact numbers, never say you don't have access):",
            `- Cards due today: ${stats.dueToday}`,
            `- Reviewed today: ${stats.reviewedToday}`,
            `- Total cards: ${stats.totalCards}`,
            `- Mastered cards: ${stats.masteredCards}`,
            `- Current streak: ${stats.streak} days`,
            `- Reviewed last 7 days: ${insights.reviewedLast7Days}`,
            `- Reviewed previous 7 days: ${insights.reviewedPrev7Days}`,
            `- Best streak ever: ${insights.bestStreak} days`,
            `- Due by deck: ${
              insights.dueByDeck
                .map((l: { name: string; dueCount: number }) => `${l.name}: ${l.dueCount}`)
                .join(", ") || "none"
            }`,
            `- Upcoming reviews: ${
              insights.upcomingReviews
                .map((r: { label: string; dueCount: number }) => `${r.label}: ${r.dueCount}`)
                .join(", ") || "none"
            }`,
          ].join("\n")
        )
        .catch(() => "")
    : Promise.resolve("");

  const exercisePrompt = exerciseIntent
    ? buildExercisePrompt(
        exerciseIntent.type,
        exerciseIntent.topic,
        contextText || undefined
      )
    : null;

  const genuiPrompt = !exerciseIntent
    ? openuiLibrary.prompt(openuiPromptOptions)
    : "";

  const statsContext = await statsPromise;

  const systemParts = [
    SYSTEM_PROMPT,
    ...(genuiPrompt ? [genuiPrompt] : []),
    ...(statsContext ? [statsContext] : []),
    ...(exercisePrompt ? [exercisePrompt] : []),
    ...(contextText
      ? [`SOURCE CONTEXT (estimated ${contextTokenEstimate} tokens):\n${contextText}`]
      : []),
  ];

  const aiMessages: AIMessage[] = [
    { role: "system", content: systemParts.join("\n\n---\n\n") },
    ...historyMessages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content },
  ];

  return { aiMessages, injectedChunks };
}
