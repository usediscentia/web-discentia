export type AIProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
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
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    defaultModel: "gpt-4o",
    requiresApiKey: true,
  },
  anthropic: {
    displayName: "Claude (Anthropic)",
    models: ["claude-sonnet-4-5-20250929"],
    defaultModel: "claude-sonnet-4-5-20250929",
    requiresApiKey: true,
  },
  gemini: {
    displayName: "Gemini (Google)",
    models: ["gemini-2.0-flash"],
    defaultModel: "gemini-2.0-flash",
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
      "openai/gpt-4o",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-70b-instruct",
    ],
    defaultModel: "openai/gpt-4o",
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
