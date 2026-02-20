"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import { getAIProvider } from "@/services/ai";
import { SYSTEM_PROMPT } from "@/lib/constants";
import { splitMessageAndCitations } from "@/lib/citations";
import {
  buildContextSnippet,
  DEFAULT_CONTEXT_TOKEN_BUDGET,
  estimateTokenCountFromChars,
} from "@/lib/tokens";
import type { Library } from "@/types/library";
import type { AIMessage } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";

export function useChat() {
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
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
  const { setSettingsOpen } = useAppStore();

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
        setSettingsOpen(true);
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
      const { contextText, usedItems } = buildContextSnippet(
        relevantItems,
        DEFAULT_CONTEXT_TOKEN_BUDGET
      );
      const contextTokenEstimate = estimateTokenCountFromChars(contextText.length);

      const citationInstruction = `If you used SOURCE context, append ONLY this block at the end:
<CITATIONS>
[{"libraryItemId":"...","libraryId":"...","itemTitle":"...","excerpt":"..."}]
</CITATIONS>
Rules:
- Use only source IDs provided in SOURCE context.
- If no source was used, return <CITATIONS>[]</CITATIONS>.
- Keep excerpt under 160 chars.`;

      // Save user message
      const userMessage = await StorageService.addMessage(
        convId,
        "user",
        content
      );
      appendMessage(userMessage);

      // Build AI message history
      const aiMessages: AIMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: citationInstruction },
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
              const allowedItemIds = new Set(
                usedItems.map((entry) => entry.item.id)
              );
              const { cleanContent, citations } = splitMessageAndCitations(
                fullText,
                allowedItemIds
              );
              await StorageService.addMessage(convId!, "assistant", cleanContent, {
                citations,
              });
              // Reload from Dexie to avoid race conditions with useEffect
              const allMessages = await StorageService.getMessages(convId!);
              setMessages(allMessages);
              setStreamingContent("");
              setIsStreaming(false);
              abortControllerRef.current = null;
            },
            onError: (err) => {
              setError(err.message);
              setStreamingContent("");
              setIsStreaming(false);
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
      setSettingsOpen,
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
