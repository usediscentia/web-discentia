import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { OPENROUTER_API_URL } from "@/lib/constants";
import { streamSSE } from "./stream";

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

    await streamSSE(response, signal, callbacks);
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
