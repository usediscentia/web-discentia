import type { AIProviderType, AIServiceProvider } from "@/types/ai";
import { openaiProvider } from "./openai.provider";
import { ollamaProvider } from "./ollama.provider";
import { openrouterProvider } from "./openrouter.provider";

const providers: Map<AIProviderType, AIServiceProvider> = new Map([
  ["openai", openaiProvider],
  ["ollama", ollamaProvider],
  ["openrouter", openrouterProvider],
]);

export function getAIProvider(
  type: AIProviderType
): AIServiceProvider | undefined {
  return providers.get(type);
}

export function getAvailableProviders(): AIServiceProvider[] {
  return Array.from(providers.values());
}
