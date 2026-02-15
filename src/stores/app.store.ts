import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS, } from "@/types/ai";
import { encrypt, decrypt } from "@/lib/crypto";
import { STORAGE_KEYS } from "@/lib/constants";

interface ProviderConfigState {
  apiKey: string;
  model: string;
}

interface AppState {
  activeConversationId: string | null;
  selectedProvider: AIProviderType;
  selectedModel: string;
  providerConfigs: Record<AIProviderType, ProviderConfigState>;
  settingsOpen: boolean;
  isStreaming: boolean;

  setActiveConversationId: (id: string | null) => void;
  setSelectedProvider: (provider: AIProviderType) => void;
  setSelectedModel: (model: string) => void;
  setProviderConfig: (type: AIProviderType, config: ProviderConfigState) => void;
  setSettingsOpen: (open: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  getActiveProviderConfig: () => ProviderConfig;
  loadProviderConfigs: () => Promise<void>;
  saveProviderConfigs: () => Promise<void>;
}

const defaultConfigs: Record<AIProviderType, ProviderConfigState> = {
  openai: { apiKey: "", model: PROVIDER_DEFAULTS.openai.defaultModel },
  anthropic: { apiKey: "", model: PROVIDER_DEFAULTS.anthropic.defaultModel },
  gemini: { apiKey: "", model: PROVIDER_DEFAULTS.gemini.defaultModel },
};

export const useAppStore = create<AppState>((set, get) => ({
  activeConversationId: null,
  selectedProvider: "openai",
  selectedModel: PROVIDER_DEFAULTS.openai.defaultModel,
  providerConfigs: { ...defaultConfigs },
  settingsOpen: false,
  isStreaming: false,

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
}));
