import Anthropic from "@anthropic-ai/sdk";
import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";

export const anthropicProvider: AIServiceProvider = {
  type: "anthropic",
  displayName: PROVIDER_DEFAULTS.anthropic.displayName,
  models: PROVIDER_DEFAULTS.anthropic.models,
  defaultModel: PROVIDER_DEFAULTS.anthropic.defaultModel,

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const client = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    let fullText = "";
    try {
      const stream = client.messages.stream(
        {
          model: config.model,
          max_tokens: 8096,
          ...(systemMessage ? { system: systemMessage.content } : {}),
          messages: chatMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        },
        { signal }
      );

      for await (const event of stream) {
        if (signal?.aborted) break;
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullText += event.delta.text;
          callbacks.onToken(event.delta.text);
        }
      }
    } catch (err) {
      if (!signal?.aborted) throw err;
      // clean abort — fall through to onComplete with accumulated text
    }

    callbacks.onComplete(fullText);
  },

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
      // Use models.list() if available; fall back to a minimal message call
      if (typeof client.models?.list === "function") {
        await client.models.list();
      } else {
        await client.messages.create({
          model: PROVIDER_DEFAULTS.anthropic.defaultModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        });
      }
      return true;
    } catch {
      return false;
    }
  },
};
