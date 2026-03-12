import type { AIProviderType, AIServiceProvider } from "@/types/ai";
import { openaiProvider } from "./openai.provider";
import { ollamaProvider } from "./ollama.provider";
import { openrouterProvider } from "./openrouter.provider";
import { anthropicProvider } from "./anthropic.provider";
import { githubModelsProvider } from "./github-models.provider";

const providers: Map<AIProviderType, AIServiceProvider> = new Map([
  ["openai", openaiProvider],
  ["ollama", ollamaProvider],
  ["openrouter", openrouterProvider],
  ["anthropic", anthropicProvider],
  ["github-models", githubModelsProvider],
]);

export function getAIProvider(
  type: AIProviderType
): AIServiceProvider | undefined {
  return providers.get(type);
}

export function getAvailableProviders(): AIServiceProvider[] {
  return Array.from(providers.values());
}
