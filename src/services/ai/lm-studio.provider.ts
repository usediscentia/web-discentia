import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { LM_STUDIO_API_URL } from "@/lib/constants";
import { streamSSE } from "./stream";

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

    await streamSSE(response, signal, callbacks);
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
