import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { OLLAMA_API_URL } from "@/lib/constants";

export const ollamaProvider: AIServiceProvider = {
  type: "ollama",
  displayName: "Ollama (Local)",
  models: [],
  defaultModel: "",

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const baseUrl = config.baseUrl || OLLAMA_API_URL;
    const url = `${baseUrl}/api/chat`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `Ollama error: ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error) errorMessage = parsed.error;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const token = parsed.message?.content;
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
            if (parsed.done) {
              callbacks.onComplete(fullText);
              return;
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      if (signal?.aborted) {
        callbacks.onComplete(fullText);
        return;
      }
      throw error;
    }
  },

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
