import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { encrypt, decrypt } from "@/lib/crypto";
import { STORAGE_KEYS, OLLAMA_API_URL } from "@/lib/constants";

export interface ProviderConfigState {
  apiKey: string;
  model: string;
}

export type OllamaStatus = "unknown" | "connected" | "disconnected";

const defaultConfigs: Record<AIProviderType, ProviderConfigState> = {
  openai: { apiKey: "", model: PROVIDER_DEFAULTS.openai.defaultModel },
  anthropic: { apiKey: "", model: PROVIDER_DEFAULTS.anthropic.defaultModel },
  gemini: { apiKey: "", model: PROVIDER_DEFAULTS.gemini.defaultModel },
  ollama: { apiKey: "", model: PROVIDER_DEFAULTS.ollama.defaultModel },
  openrouter: { apiKey: "", model: PROVIDER_DEFAULTS.openrouter.defaultModel },
};

interface ProviderState {
  selectedProvider: AIProviderType;
  selectedModel: string;
  providerConfigs: Record<AIProviderType, ProviderConfigState>;
  ollamaStatus: OllamaStatus;
  ollamaModels: string[];

  setSelectedProvider: (provider: AIProviderType) => void;
  setSelectedModel: (model: string) => void;
  setProviderConfig: (
    type: AIProviderType,
    config: ProviderConfigState
  ) => void;
  getActiveProviderConfig: () => ProviderConfig;
  loadProviderConfigs: () => Promise<void>;
  saveProviderConfigs: () => Promise<void>;
  checkOllamaConnection: () => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  selectedProvider: "openai",
  selectedModel: PROVIDER_DEFAULTS.openai.defaultModel,
  providerConfigs: { ...defaultConfigs },
  ollamaStatus: "unknown",
  ollamaModels: [],

  setSelectedProvider: (provider) => {
    const model = get().providerConfigs[provider].model;
    set({
      selectedProvider: provider,
      selectedModel: model,
    });
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
    void get().saveProviderConfigs();
  },

  setProviderConfig: (type, config) =>
    set((state) => {
      const nextConfigs = { ...state.providerConfigs, [type]: config };
      return {
        providerConfigs: nextConfigs,
        ...(state.selectedProvider === type ? { selectedModel: config.model } : {}),
      };
    }),

  getActiveProviderConfig: () => {
    const state = get();
    const config = state.providerConfigs[state.selectedProvider];
    return {
      type: state.selectedProvider,
      apiKey: config.apiKey,
      model: state.selectedModel,
    };
  },

  loadProviderConfigs: async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIGS);
      const configs = { ...defaultConfigs };
      if (raw) {
        const encrypted: Record<string, { apiKey: string; model: string }> =
          JSON.parse(raw);

        for (const [key, value] of Object.entries(encrypted)) {
          const type = key as AIProviderType;
          if (!configs[type]) continue;

          configs[type] = {
            apiKey: value.apiKey ? await decrypt(value.apiKey) : "",
            model: value.model || configs[type].model,
          };
        }
      }

      const savedProvider = localStorage.getItem(
        STORAGE_KEYS.SELECTED_PROVIDER
      ) as AIProviderType | null;
      const selectedProvider =
        savedProvider && configs[savedProvider] ? savedProvider : "openai";
      const selectedModel =
        localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) ||
        configs[selectedProvider].model;

      set({
        providerConfigs: configs,
        selectedProvider,
        selectedModel,
      });
    } catch {
      // corrupted storage — start fresh
    }
  },

  saveProviderConfigs: async () => {
    const configs = get().providerConfigs;
    const encrypted: Record<string, { apiKey: string; model: string }> = {};

    for (const [key, value] of Object.entries(configs)) {
      encrypted[key] = {
        apiKey: value.apiKey ? await encrypt(value.apiKey) : "",
        model: value.model,
      };
    }

    localStorage.setItem(
      STORAGE_KEYS.PROVIDER_CONFIGS,
      JSON.stringify(encrypted)
    );
  },

  checkOllamaConnection: async () => {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
      if (!response.ok) {
        set({ ollamaStatus: "disconnected", ollamaModels: [] });
        return;
      }
      const data = await response.json();
      const models: string[] = (data.models ?? []).map(
        (m: { name: string }) => m.name
      );
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
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, models[0]);
        void get().saveProviderConfigs();
      }
    } catch {
      set({ ollamaStatus: "disconnected", ollamaModels: [] });
    }
  },
}));
