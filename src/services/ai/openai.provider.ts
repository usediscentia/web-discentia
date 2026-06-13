import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { OPENAI_API_URL } from "@/lib/constants";
import { streamSSE } from "./stream";

export const openaiProvider: AIServiceProvider = {
  type: "openai",
  displayName: "OpenAI",
  models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  defaultModel: "gpt-4o",

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${config.baseUrl || OPENAI_API_URL}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        temperature: config.temperature ?? 1,
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `OpenAI API error: ${response.status}`;
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
      const response = await fetch(`${OPENAI_API_URL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
