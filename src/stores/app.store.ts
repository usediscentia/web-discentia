import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS, } from "@/types/ai";
import { encrypt, decrypt } from "@/lib/crypto";
import { STORAGE_KEYS, OLLAMA_API_URL } from "@/lib/constants";

interface ProviderConfigState {
  apiKey: string;
  model: string;
}

export type OllamaStatus = "unknown" | "connected" | "disconnected";

interface AppState {
  activeConversationId: string | null;
  selectedProvider: AIProviderType;
  selectedModel: string;
  providerConfigs: Record<AIProviderType, ProviderConfigState>;
  settingsOpen: boolean;
  isStreaming: boolean;
  ollamaStatus: OllamaStatus;
  ollamaModels: string[];

  setActiveConversationId: (id: string | null) => void;
  setSelectedProvider: (provider: AIProviderType) => void;
  setSelectedModel: (model: string) => void;
  setProviderConfig: (type: AIProviderType, config: ProviderConfigState) => void;
  setSettingsOpen: (open: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  getActiveProviderConfig: () => ProviderConfig;
  loadProviderConfigs: () => Promise<void>;
  saveProviderConfigs: () => Promise<void>;
  checkOllamaConnection: () => Promise<void>;
}

const defaultConfigs: Record<AIProviderType, ProviderConfigState> = {
  openai: { apiKey: "", model: PROVIDER_DEFAULTS.openai.defaultModel },
  anthropic: { apiKey: "", model: PROVIDER_DEFAULTS.anthropic.defaultModel },
  gemini: { apiKey: "", model: PROVIDER_DEFAULTS.gemini.defaultModel },
  ollama: { apiKey: "", model: PROVIDER_DEFAULTS.ollama.defaultModel },
  openrouter: { apiKey: "", model: PROVIDER_DEFAULTS.openrouter.defaultModel },
};

export const useAppStore = create<AppState>((set, get) => ({
  activeConversationId: null,
  selectedProvider: "openai",
  selectedModel: PROVIDER_DEFAULTS.openai.defaultModel,
  providerConfigs: { ...defaultConfigs },
  settingsOpen: false,
  isStreaming: false,
  ollamaStatus: "unknown",
  ollamaModels: [],

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setSelectedProvider: (provider) =>
    set({
      selectedProvider: provider,
      selectedModel: get().providerConfigs[provider].model,
    }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  setProviderConfig: (type, config) =>
    set((state) => ({
      providerConfigs: { ...state.providerConfigs, [type]: config },
    })),

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

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
      if (!raw) return;

      const encrypted: Record<string, { apiKey: string; model: string }> =
        JSON.parse(raw);
      const configs = { ...defaultConfigs };

      for (const [key, value] of Object.entries(encrypted)) {
        const type = key as AIProviderType;
        if (configs[type] && value.apiKey) {
          configs[type] = {
            apiKey: await decrypt(value.apiKey),
            model: value.model || configs[type].model,
          };
        }
      }

      set({ providerConfigs: configs });
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
      const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
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
          ...(state.selectedProvider === "ollama" ? { selectedModel: models[0] } : {}),
        });
      }
    } catch {
      set({ ollamaStatus: "disconnected", ollamaModels: [] });
    }
  },
}));
