"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import { getAIProvider } from "@/services/ai";
import { SYSTEM_PROMPT } from "@/lib/constants";
import type { Message } from "@/types/chat";
import type { AIMessage } from "@/types/ai";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    activeConversationId,
    setActiveConversationId,
    getActiveProviderConfig,
    isStreaming,
    setIsStreaming,
    setSettingsOpen,
  } = useAppStore();

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    StorageService.getMessages(activeConversationId).then(setMessages);
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const config = getActiveProviderConfig();

      if (!config.apiKey) {
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
          content.slice(0, 50)
        );
        convId = conversation.id;
        setActiveConversationId(convId);
      }

      // Save user message
      const userMessage = await StorageService.addMessage(
        convId,
        "user",
        content
      );
      setMessages((prev) => [...prev, userMessage]);

      // Build AI message history
      const aiMessages: AIMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
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
              // Save assistant message to Dexie
              const assistantMessage = await StorageService.addMessage(
                convId!,
                "assistant",
                fullText
              );
              setMessages((prev) => [...prev, assistantMessage]);
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
      setActiveConversationId,
      setIsStreaming,
      setSettingsOpen,
    ]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent("");
    setError(null);
  }, [setActiveConversationId]);

  return {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    startNewConversation,
  };
}
