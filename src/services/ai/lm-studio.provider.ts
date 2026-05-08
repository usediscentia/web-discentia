import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { LM_STUDIO_API_URL } from "@/lib/constants";

export const lmStudioProvider: AIServiceProvider = {
  type: "lm-studio",
  displayName: "LM Studio",
  models: [],
  defaultModel: "",

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch("/api/lm-studio/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: config.baseUrl || LM_STUDIO_API_URL,
        model: config.model,
        messages,
        stream: true,
        ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `LM Studio error: ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error?.message) errorMessage = parsed.error.message;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("LM Studio returned empty stream body");

    const decoder = new TextDecoder();
    const parts: string[] = [];
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            callbacks.onComplete(parts.join(""));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              parts.push(token);
              callbacks.onToken(token);
            }
          } catch {
            // skip malformed JSON chunks
          }
        }
      }

      callbacks.onComplete(parts.join(""));
    } catch (error) {
      if (signal?.aborted) {
        callbacks.onComplete(parts.join(""));
        return;
      }
      throw error;
    } finally {
      try { reader.releaseLock(); } catch { /* reader already released */ }
    }
  },

  async validateApiKey(): Promise<boolean> {
    try {
      const params = new URLSearchParams({ baseUrl: LM_STUDIO_API_URL });
      const response = await fetch(`/api/lm-studio/models?${params}`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
