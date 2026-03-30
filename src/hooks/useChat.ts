"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import { getAIProvider } from "@/services/ai";
import { SYSTEM_PROMPT } from "@/lib/constants";
import { stripCitationsBlock, extractCitationsFromChunks } from "@/lib/citations";
import {
  detectExerciseIntent,
  parseExerciseFromResponse,
} from "@/services/ai/parsers/exercise.parser";
import { buildExercisePrompt } from "@/services/ai/prompts/exercise.prompts";
import { getDB } from "@/services/storage/database";
import {
  buildContextSnippet,
  DEFAULT_CONTEXT_TOKEN_BUDGET,
  estimateTokenCountFromChars,
} from "@/lib/tokens";
import type { Library } from "@/types/library";
import type { AIMessage } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { openuiLibrary, openuiPromptOptions } from "@/services/ai/openui";

export function useChat() {
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [availableLibraries, setAvailableLibraries] = useState<Library[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextLoadRef = useRef(false);

  const {
    messages,
    activeConversationId,
    setActiveConversationId,
    isStreaming,
    setIsStreaming,
    setMessages,
    appendMessage,
    clearMessages,
    selectedLibraryIds,
    setSelectedLibraryIds,
    toggleLibrary,
    clearLibraries,
  } = useChatStore();

  const { getActiveProviderConfig } = useProviderStore();
  const { setActiveView } = useAppStore();

  const refreshLibraries = useCallback(async () => {
    const libraries = await StorageService.listLibraries();
    setAvailableLibraries(libraries);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      refreshLibraries().catch(() => {
        // keep previous values if loading libraries fails
      });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [refreshLibraries]);

  // Load messages when conversation changes (e.g. page refresh, switching conversations)
  // Skipped when we just created the conversation ourselves in sendMessage
  useEffect(() => {
    let cancelled = false;

    if (!activeConversationId) {
      clearMessages();
      clearLibraries();
      return;
    }
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }

    Promise.all([
      StorageService.getMessages(activeConversationId),
      StorageService.getConversation(activeConversationId),
    ])
      .then(([conversationMessages, conversation]) => {
        if (cancelled) return;
        setMessages(conversationMessages);
        setSelectedLibraryIds(conversation?.libraryIds || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load conversation from storage"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeConversationId,
    clearLibraries,
    clearMessages,
    setMessages,
    setSelectedLibraryIds,
  ]);

  const sendMessage = useCallback(
    async (content: string) => {
      const config = getActiveProviderConfig();

      if (PROVIDER_DEFAULTS[config.type].requiresApiKey && !config.apiKey) {
        setActiveView("settings");
        return;
      }

      const provider = getAIProvider(config.type);
      if (!provider) {
        setError(`Provider "${config.type}" is not available.`);
        return;
      }

      setError(null);

      // Create conversation if needed
      let convId = activeConversationId;
      if (!convId) {
        const conversation = await StorageService.createConversation(
          content.slice(0, 50),
          selectedLibraryIds
        );
        convId = conversation.id;
        skipNextLoadRef.current = true;
        setActiveConversationId(convId);
      }

      // Persist selected libraries in existing conversations as well.
      await StorageService.updateConversation(convId, {
        libraryIds: selectedLibraryIds,
        updatedAt: Date.now(),
      });

      const relevantItems = selectedLibraryIds.length
        ? await StorageService.searchLibraryItems({
            query: content,
            libraryIds: selectedLibraryIds,
            limit: 24,
          })
        : [];
      const { contextText, injectedChunks } = buildContextSnippet(
        relevantItems,
        DEFAULT_CONTEXT_TOKEN_BUDGET
      );
      const contextTokenEstimate = estimateTokenCountFromChars(contextText.length);

      // Detect exercise generation intent — regex only (AI classifier removed: too many false positives)
      const exerciseIntent = detectExerciseIntent(content);

      // Start stats fetch early (parallel with message save) — don't await yet.
      // Skipped for exercise generation where stats context is not needed.
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
                `- Due by library: ${insights.dueByLibrary.map((l) => `${l.name}: ${l.dueCount}`).join(", ") || "none"}`,
                `- Upcoming reviews: ${insights.upcomingReviews.map((r) => `${r.label}: ${r.dueCount}`).join(", ") || "none"}`,
              ].join("\n")
            )
            .catch(() => "")
        : Promise.resolve("");

      // Save user message
      const userMessage = await StorageService.addMessage(
        convId,
        "user",
        content
      );
      appendMessage(userMessage);

      const exercisePrompt = exerciseIntent
        ? buildExercisePrompt(exerciseIntent.type, exerciseIntent.topic, contextText || undefined)
        : null;

      // Build AI message history.
      // For exercises: include exercise prompt + library context (no citation block —
      //   it conflicts with the JSON-only instruction and produces malformed output).
      // For normal chat: include citation instruction + library context.
      const genuiPrompt = !exerciseIntent ? openuiLibrary.prompt(openuiPromptOptions) : "";

      // Resolve stats fetch (runs in parallel with message save above)
      const statsContext = await statsPromise;

      const aiMessages: AIMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(genuiPrompt ? [{ role: "system" as const, content: genuiPrompt }] : []),
        ...(statsContext ? [{ role: "system" as const, content: statsContext }] : []),
        ...(exercisePrompt
          ? [{ role: "system" as const, content: exercisePrompt }]
          : []),
        ...(contextText
          ? [
              {
                role: "system" as const,
                content: `SOURCE CONTEXT (estimated ${contextTokenEstimate} tokens):\n${contextText}`,
              },
            ]
          : []),
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content },
      ];

      // Start streaming
      setIsStreaming(true);
      setStreamingContent("");
      if (exerciseIntent) setIsGeneratingExercise(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await provider.sendMessage(
          aiMessages,
          config,
          {
            onToken: (token) => {
              setStreamingContent((prev) => prev + token);
            },
            onComplete: async (fullText) => {
              // Strip any <CITATIONS> block the AI might have emitted, then
              // auto-extract citations by matching response text against the
              // chunks we actually injected into the context.
              const cleanContent = stripCitationsBlock(fullText);
              const citations = extractCitationsFromChunks(cleanContent, injectedChunks);

              // Save the assistant message first to get a real messageId
              let exerciseId: string | undefined;

              // Pre-parse exercise so we can include its id on the message
              const parsedExercise = exerciseIntent
                ? parseExerciseFromResponse(fullText, "" /* placeholder, set below */)
                : null;

              if (parsedExercise) {
                exerciseId = parsedExercise.id;
              }

              const savedMessage = await StorageService.addMessage(convId!, "assistant", cleanContent, {
                citations,
                exerciseId,
                provider: config.type,
              });

              // Now save the exercise with the real messageId
              if (parsedExercise) {
                try {
                  parsedExercise.messageId = savedMessage.id;
                  parsedExercise.sourceItemId = injectedChunks[0]?.libraryItemId;
                  await getDB().exercises.add(parsedExercise);
                } catch {
                  // Exercise storage failed — message is already saved
                }
              }

              // Reload from Dexie to avoid race conditions with useEffect
              const allMessages = await StorageService.getMessages(convId!);
              setMessages(allMessages);
              setStreamingContent("");
              setIsStreaming(false);
              setIsGeneratingExercise(false);
              abortControllerRef.current = null;
            },
            onError: (err) => {
              setError(err.message);
              setStreamingContent("");
              setIsStreaming(false);
              setIsGeneratingExercise(false);
              abortControllerRef.current = null;
            },
          },
          controller.signal
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
        setStreamingContent("");
        setIsStreaming(false);
        setIsGeneratingExercise(false);
        abortControllerRef.current = null;
      }
    },
    [
      activeConversationId,
      messages,
      getActiveProviderConfig,
      appendMessage,
      selectedLibraryIds,
      setActiveConversationId,
      setIsStreaming,
      setActiveView,
      setMessages,
    ]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    clearMessages();
    clearLibraries();
    setStreamingContent("");
    setError(null);
  }, [clearLibraries, clearMessages, setActiveConversationId]);

  return {
    messages,
    activeConversationId,
    streamingContent,
    isStreaming,
    isGeneratingExercise,
    error,
    sendMessage,
    stopStreaming,
    startNewConversation,
    availableLibraries,
    selectedLibraryIds,
    toggleLibrary,
    setSelectedLibraryIds,
    refreshLibraries,
  };
}
