"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import { stripCitationsBlock, extractCitationsFromChunks } from "@/lib/citations";
import {
  detectExerciseIntent,
  parseExerciseFromResponse,
} from "@/services/ai/parsers/exercise.parser";
import type { Library } from "@/types/library";
import type { AIMessage } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { buildChatContext } from "@/lib/chat-context";

export function useChat() {
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [availableLibraries, setAvailableLibraries] = useState<Library[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextLoadRef = useRef(false);
  const tokenBufferRef = useRef<string>("");
  const flushHandleRef = useRef<number | null>(null);

  const messages = useChatStore(s => s.messages);
  const activeConversationId = useChatStore(s => s.activeConversationId);
  const setActiveConversationId = useChatStore(s => s.setActiveConversationId);
  const isStreaming = useChatStore(s => s.isStreaming);
  const setIsStreaming = useChatStore(s => s.setIsStreaming);
  const setMessages = useChatStore(s => s.setMessages);
  const appendMessage = useChatStore(s => s.appendMessage);
  const clearMessages = useChatStore(s => s.clearMessages);
  const selectedLibraryIds = useChatStore(s => s.selectedLibraryIds);
  const setSelectedLibraryIds = useChatStore(s => s.setSelectedLibraryIds);
  const toggleLibrary = useChatStore(s => s.toggleLibrary);
  const clearLibraries = useChatStore(s => s.clearLibraries);

  const { getConfiguredProvider } = useProviderStore();
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
      const { config, provider } = getConfiguredProvider();

      if (PROVIDER_DEFAULTS[config.type].requiresApiKey && !config.apiKey) {
        setActiveView("settings");
        return;
      }

      if (!provider) {
        setError(`Provider "${config.type}" is not available.`);
        return;
      }

      setError(null);

      // Read fresh values from store — keeps callback identity stable across token flushes.
      const { activeConversationId: currentConvId, messages: currentMessages } =
        useChatStore.getState();

      // Create conversation if needed
      let convId = currentConvId;
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

      // Save user message
      const userMessage = await StorageService.addMessage(convId, "user", content);
      appendMessage(userMessage);

      const exerciseIntent = detectExerciseIntent(content);

      const { aiMessages, injectedChunks } = await buildChatContext(
        content,
        selectedLibraryIds,
        currentMessages,
        exerciseIntent
      );

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
              // Batch token flushes via rAF — avoids one React render per token.
              tokenBufferRef.current += token;
              if (flushHandleRef.current == null) {
                flushHandleRef.current = window.requestAnimationFrame(() => {
                  const pending = tokenBufferRef.current;
                  tokenBufferRef.current = "";
                  flushHandleRef.current = null;
                  if (pending) setStreamingContent((prev) => prev + pending);
                });
              }
            },
            onComplete: async (fullText) => {
              // Drain any pending batched tokens before resetting streaming state.
              if (flushHandleRef.current != null) {
                window.cancelAnimationFrame(flushHandleRef.current);
                flushHandleRef.current = null;
              }
              tokenBufferRef.current = "";
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
                  await StorageService.saveExercise(parsedExercise);
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
              if (flushHandleRef.current != null) {
                window.cancelAnimationFrame(flushHandleRef.current);
                flushHandleRef.current = null;
              }
              tokenBufferRef.current = "";
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
        if (flushHandleRef.current != null) {
          window.cancelAnimationFrame(flushHandleRef.current);
          flushHandleRef.current = null;
        }
        tokenBufferRef.current = "";
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
      getConfiguredProvider,
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
