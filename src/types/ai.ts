export type AIProviderType =
  | "openai"
  | "anthropic"
  | "ollama"
  | "openrouter"
  | "github-copilot";

export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
  temperature?: number;
  baseUrl?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface AIServiceProvider {
  type: AIProviderType;
  displayName: string;
  models: string[];
  defaultModel: string;
  sendMessage: (
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ) => Promise<void>;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  /** Optional: providers with dynamic model lists implement this */
  fetchModels?: (apiKey: string) => Promise<string[]>;
}

export const PROVIDER_DEFAULTS: Record<
  AIProviderType,
  {
    displayName: string;
    models: string[];
    defaultModel: string;
    requiresApiKey: boolean;
    apiKeyDescription?: string;
  }
> = {
  openai: {
    displayName: "OpenAI",
    models: ["gpt-5.2", "gpt-5.2-pro", "gpt-5-mini", "gpt-5-nano", "gpt-5.1", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "o3", "o4-mini"],
    defaultModel: "gpt-5.2",
    requiresApiKey: true,
  },
  anthropic: {
    displayName: "Anthropic",
    models: ["claude-opus-4-1-20250805", "claude-sonnet-4-20250514", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"],
    defaultModel: "claude-sonnet-4-20250514",
    requiresApiKey: true,
  },
  ollama: {
    displayName: "Ollama (Local)",
    models: [],
    defaultModel: "",
    requiresApiKey: false,
  },
  openrouter: {
    displayName: "OpenRouter",
    models: [
      "openai/gpt-5.2",
      "openai/gpt-5-mini",
      "openai/gpt-4.1",
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4",
      "google/gemini-2.5-flash",
      "meta-llama/llama-3.3-70b-instruct",
    ],
    defaultModel: "openai/gpt-5.2",
    requiresApiKey: true,
  },
  "github-copilot": {
    displayName: "GitHub Copilot",
    models: [],       // populated dynamically via fetchModels
    defaultModel: "", // set after first fetch
    requiresApiKey: true,
    apiKeyDescription: "Connect your GitHub account with an active Copilot subscription",
  },
};
