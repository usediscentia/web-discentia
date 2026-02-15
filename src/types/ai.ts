export type AIProviderType = "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
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
}

export const PROVIDER_DEFAULTS: Record<
  AIProviderType,
  { displayName: string; models: string[]; defaultModel: string }
> = {
  openai: {
    displayName: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    defaultModel: "gpt-4o",
  },
  anthropic: {
    displayName: "Claude (Anthropic)",
    models: ["claude-sonnet-4-5-20250929"],
    defaultModel: "claude-sonnet-4-5-20250929",
  },
  gemini: {
    displayName: "Gemini (Google)",
    models: ["gemini-2.0-flash"],
    defaultModel: "gemini-2.0-flash",
  },
};
