import type { AIProviderType, AIServiceProvider } from "@/types/ai";
import { openaiProvider } from "./openai.provider";

const providers: Map<AIProviderType, AIServiceProvider> = new Map([
  ["openai", openaiProvider],
]);

export function getAIProvider(
  type: AIProviderType
): AIServiceProvider | undefined {
  return providers.get(type);
}

export function getAvailableProviders(): AIServiceProvider[] {
  return Array.from(providers.values());
}
