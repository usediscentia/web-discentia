import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { apiFetch } from "@/lib/api-client";
import { STORAGE_KEYS, OLLAMA_API_URL } from "@/lib/constants";
import { githubCopilotProvider } from "@/services/ai/github-copilot.provider";

export interface ProviderConfigState {
  apiKey: string;
  model: string;
  temperature?: number;
  baseUrl?: string;
}

export type OllamaStatus = "unknown" | "connected" | "disconnected";

const SERVER_KEY_PROVIDERS: AIProviderType[] = ["openai", "anthropic", "openrouter", "github-copilot"];

const defaultConfigs: Record<AIProviderType, ProviderConfigState> = {
  openai: { apiKey: "", model: PROVIDER_DEFAULTS.openai.defaultModel },
  anthropic: { apiKey: "", model: PROVIDER_DEFAULTS.anthropic.defaultModel },
  ollama: { apiKey: "", model: PROVIDER_DEFAULTS.ollama.defaultModel },
  openrouter: { apiKey: "", model: PROVIDER_DEFAULTS.openrouter.defaultModel },
  "github-copilot": { apiKey: "", model: PROVIDER_DEFAULTS["github-copilot"].defaultModel },
};

interface ProviderState {
  selectedProvider: AIProviderType;
  selectedModel: string;
  providerConfigs: Record<AIProviderType, ProviderConfigState>;
  ollamaStatus: OllamaStatus;
  ollamaModels: string[];
  githubCopilotModels: string[];

  setSelectedProvider: (provider: AIProviderType) => void;
  setSelectedModel: (model: string) => void;
  setProviderConfig: (type: AIProviderType, config: ProviderConfigState) => void;
  getActiveProviderConfig: () => ProviderConfig;
  loadProviderConfigs: () => Promise<void>;
  saveProviderConfig: (type: AIProviderType, apiKey: string) => Promise<void>;
  checkOllamaConnection: () => Promise<void>;
  fetchGithubCopilotModels: () => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  selectedProvider: "openai",
  selectedModel: PROVIDER_DEFAULTS.openai.defaultModel,
  providerConfigs: { ...defaultConfigs },
  ollamaStatus: "unknown",
  ollamaModels: [],
  githubCopilotModels: [],

  setSelectedProvider: (provider) => {
    const model = get().providerConfigs[provider].model;
    set({ selectedProvider: provider, selectedModel: model });
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, provider);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  },

  setSelectedModel: (model) => {
    const state = get();
    set({
      selectedModel: model,
      providerConfigs: {
        ...state.providerConfigs,
        [state.selectedProvider]: {
          ...state.providerConfigs[state.selectedProvider],
          model,
        },
      },
    });
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  },

  setProviderConfig: (type, config) =>
    set((state) => {
      const nextConfigs = { ...state.providerConfigs, [type]: config };
      return {
        providerConfigs: nextConfigs,
        ...(state.selectedProvider === type
          ? { selectedModel: config.model }
          : {}),
      };
    }),

  getActiveProviderConfig: () => {
    const state = get();
    const config = state.providerConfigs[state.selectedProvider];
    return {
      type: state.selectedProvider,
      apiKey: config.apiKey,
      model: state.selectedModel,
      temperature: config.temperature,
      baseUrl: config.baseUrl,
    };
  },

  loadProviderConfigs: async () => {
    try {
      const configs = { ...defaultConfigs };

      const results = await Promise.allSettled(
        SERVER_KEY_PROVIDERS.map((provider) =>
          apiFetch<{ provider: string; key: string }>(`/keys/${provider}`)
        )
      );

      results.forEach((result, i) => {
        const provider = SERVER_KEY_PROVIDERS[i];
        if (result.status === "fulfilled") {
          configs[provider] = {
            ...configs[provider],
            apiKey: result.value.key,
          };
        }
        // 404 = key not configured — leave apiKey as ""
      });

      const savedProvider = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER) as AIProviderType | null;
      const selectedProvider = savedProvider && configs[savedProvider] ? savedProvider : "openai";
      const selectedModel =
        localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) ||
        configs[selectedProvider].model;

      set({ providerConfigs: configs, selectedProvider, selectedModel });

      if (selectedProvider === "github-copilot" && configs["github-copilot"].apiKey) {
        void get().fetchGithubCopilotModels();
      }
    } catch {
      // network error — continue with empty keys
    }
  },

  saveProviderConfig: async (type: AIProviderType, apiKey: string) => {
    if (!apiKey) return;
    await apiFetch("/keys", {
      method: "POST",
      body: JSON.stringify({ provider: type, key: apiKey }),
    });
  },

  checkOllamaConnection: async () => {
    try {
      const ollamaBaseUrl =
        get().providerConfigs.ollama.baseUrl ?? OLLAMA_API_URL;
      const response = await fetch(`${ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        set({ ollamaStatus: "disconnected", ollamaModels: [] });
        return;
      }
      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models: string[] = (data.models ?? []).map((m) => m.name);
      set({ ollamaStatus: "connected", ollamaModels: models });

      // Auto-select first available model if current one isn't installed
      const state = get();
      const currentModel = state.providerConfigs.ollama.model;
      if (models.length > 0 && !models.includes(currentModel)) {
        set({
          providerConfigs: {
            ...state.providerConfigs,
            ollama: { ...state.providerConfigs.ollama, model: models[0] },
          },
          ...(state.selectedProvider === "ollama"
            ? { selectedModel: models[0] }
            : {}),
        });
        if (state.selectedProvider === "ollama") {
          localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, models[0]);
        }
      }
    } catch {
      set({ ollamaStatus: "disconnected", ollamaModels: [] });
    }
  },

  fetchGithubCopilotModels: async () => {
    const accessToken = get().providerConfigs["github-copilot"].apiKey;
    if (!accessToken) return;

    try {
      const models = await githubCopilotProvider.fetchModels!(accessToken);
      set({ githubCopilotModels: models });

      // Auto-select first model if current model isn't in the list
      const state = get();
      const currentModel = state.providerConfigs["github-copilot"].model;
      if (models.length > 0 && !models.includes(currentModel)) {
        set({
          providerConfigs: {
            ...state.providerConfigs,
            "github-copilot": {
              ...state.providerConfigs["github-copilot"],
              model: models[0],
            },
          },
          ...(state.selectedProvider === "github-copilot"
            ? { selectedModel: models[0] }
            : {}),
        });
        if (state.selectedProvider === "github-copilot") {
          localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, models[0]);
        }
      }
    } catch (err) {
      console.error("[GitHub Copilot] fetchModels failed:", err);
      set({ githubCopilotModels: [] });
    }
  },
}));
