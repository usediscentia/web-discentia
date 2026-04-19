import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { OPENROUTER_API_URL } from "@/lib/constants";

export const openrouterProvider: AIServiceProvider = {
  type: "openrouter",
  displayName: "OpenRouter",
  models: [
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-70b-instruct",
  ],
  defaultModel: "openai/gpt-4o",

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const baseUrl = config.baseUrl || OPENROUTER_API_URL;
    const url = `${baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://discentia.app",
        "X-Title": "Discentia",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `OpenRouter API error: ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error?.message) errorMessage = parsed.error.message;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("OpenRouter returned empty stream body");

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

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/auth/key`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
