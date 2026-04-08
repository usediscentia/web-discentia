import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import {
  STORAGE_KEYS,
  OLLAMA_API_URL,
  GITHUB_COPILOT_USERNAME_KEY,
} from "@/lib/constants";
import { decrypt, encrypt } from "@/lib/crypto";
import { githubCopilotProvider } from "@/services/ai/github-copilot.provider";

export interface ProviderConfigState {
  apiKey: string;
  model: string;
  temperature?: number;
  baseUrl?: string;
}

export type OllamaStatus = "unknown" | "connected" | "disconnected";

const defaultConfigs: Record<AIProviderType, ProviderConfigState> = {
  openai: { apiKey: "", model: PROVIDER_DEFAULTS.openai.defaultModel },
  anthropic: { apiKey: "", model: PROVIDER_DEFAULTS.anthropic.defaultModel },
  ollama: { apiKey: "", model: PROVIDER_DEFAULTS.ollama.defaultModel },
  openrouter: { apiKey: "", model: PROVIDER_DEFAULTS.openrouter.defaultModel },
  "github-copilot": { apiKey: "", model: PROVIDER_DEFAULTS["github-copilot"].defaultModel },
};

type EncryptedProviderConfigs = Partial<
  Record<AIProviderType, Omit<ProviderConfigState, "apiKey"> & { apiKey: string }>
>;

async function persistProviderConfigs(
  configs: Record<AIProviderType, ProviderConfigState>
): Promise<void> {
  const entries = await Promise.all(
    Object.entries(configs).map(async ([type, config]) => {
      const apiKey = config.apiKey ? await encrypt(config.apiKey) : "";
      return [type, { ...config, apiKey }] as const;
    })
  );

  localStorage.setItem(
    STORAGE_KEYS.PROVIDER_CONFIGS,
    JSON.stringify(Object.fromEntries(entries))
  );
}

async function readProviderConfigs(): Promise<Record<AIProviderType, ProviderConfigState>> {
  const raw = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIGS);
  if (!raw) return { ...defaultConfigs };

  try {
    const parsed = JSON.parse(raw) as EncryptedProviderConfigs;
    const configs = { ...defaultConfigs };

    for (const type of Object.keys(defaultConfigs) as AIProviderType[]) {
      const stored = parsed[type];
      if (!stored) continue;

      let apiKey = "";
      if (stored.apiKey) {
        try {
          apiKey = await decrypt(stored.apiKey);
        } catch {
          apiKey = "";
        }
      }

      configs[type] = {
        ...configs[type],
        ...stored,
        apiKey,
      };
    }

    return configs;
  } catch {
    return { ...defaultConfigs };
  }
}

let ollamaCheckPromise: Promise<void> | null = null;
let lastOllamaCheckAt = 0;

interface ProviderState {
  selectedProvider: AIProviderType;
  selectedModel: string;
  providerConfigs: Record<AIProviderType, ProviderConfigState>;
  ollamaStatus: OllamaStatus;
  ollamaModels: string[];
  githubCopilotModels: string[];
  githubCopilotError: string | null;

  setSelectedProvider: (provider: AIProviderType) => void;
  setSelectedModel: (model: string) => void;
  setProviderConfig: (type: AIProviderType, config: ProviderConfigState) => void;
  getActiveProviderConfig: () => ProviderConfig;
  loadProviderConfigs: () => Promise<void>;
  saveProviderConfig: (type: AIProviderType, apiKey: string) => Promise<void>;
  checkOllamaConnection: () => Promise<void>;
  fetchGithubCopilotModels: () => Promise<void>;
  clearGithubCopilotConnection: (error?: string | null) => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  selectedProvider: "openai",
  selectedModel: PROVIDER_DEFAULTS.openai.defaultModel,
  providerConfigs: { ...defaultConfigs },
  ollamaStatus: "unknown",
  ollamaModels: [],
  githubCopilotModels: [],
  githubCopilotError: null,

  setSelectedProvider: (provider) => {
    const model = get().providerConfigs[provider].model;
    set({ selectedProvider: provider, selectedModel: model });
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, provider);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  },

  setSelectedModel: (model) => {
    const state = get();
    const nextConfigs = {
      ...state.providerConfigs,
      [state.selectedProvider]: {
        ...state.providerConfigs[state.selectedProvider],
        model,
      },
    };
    set({
      selectedModel: model,
      providerConfigs: nextConfigs,
    });
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
    void persistProviderConfigs(nextConfigs);
  },

  setProviderConfig: (type, config) =>
    set((state) => {
      const nextConfigs = { ...state.providerConfigs, [type]: config };
      void persistProviderConfigs(nextConfigs);
      return {
        providerConfigs: nextConfigs,
        ...(type === "github-copilot" ? { githubCopilotError: null } : {}),
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
    const configs = await readProviderConfigs();
    const savedProvider = localStorage.getItem(
      STORAGE_KEYS.SELECTED_PROVIDER
    ) as AIProviderType | null;
    const selectedProvider =
      savedProvider && configs[savedProvider] ? savedProvider : "openai";
    const selectedModel =
      localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) ||
      configs[selectedProvider].model;

    set({ providerConfigs: configs, selectedProvider, selectedModel });

    if (configs["github-copilot"].apiKey) {
      void get().fetchGithubCopilotModels();
    }
  },

  saveProviderConfig: async (type: AIProviderType, apiKey: string) => {
    const state = get();
    const nextConfigs = {
      ...state.providerConfigs,
      [type]: {
        ...state.providerConfigs[type],
        apiKey,
      },
    };
    set({
      providerConfigs: nextConfigs,
      ...(type === "github-copilot" ? { githubCopilotError: null } : {}),
    });
    await persistProviderConfigs(nextConfigs);
  },

  clearGithubCopilotConnection: async (error = null) => {
    const state = get();
    const nextConfigs = {
      ...state.providerConfigs,
      "github-copilot": {
        ...state.providerConfigs["github-copilot"],
        apiKey: "",
        model: "",
      },
    };

    localStorage.removeItem(GITHUB_COPILOT_USERNAME_KEY);
    set({
      providerConfigs: nextConfigs,
      githubCopilotModels: [],
      githubCopilotError: error,
      ...(state.selectedProvider === "github-copilot"
        ? { selectedModel: "" }
        : {}),
    });
    await persistProviderConfigs(nextConfigs);
  },

  checkOllamaConnection: async () => {
    if (ollamaCheckPromise) {
      return ollamaCheckPromise;
    }

    if (Date.now() - lastOllamaCheckAt < 5000) {
      return;
    }

    lastOllamaCheckAt = Date.now();
    ollamaCheckPromise = (async () => {
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

      // Auto-select Ollama if current provider has no key configured
      {
        const s = get();
        const currentNeedsKey = PROVIDER_DEFAULTS[s.selectedProvider].requiresApiKey;
        const currentConfig = s.providerConfigs[s.selectedProvider];
        if (currentNeedsKey && !currentConfig.apiKey && models.length > 0) {
          set({ selectedProvider: "ollama" });
          localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, "ollama");
        }
      }

      // Auto-select first available model if current one isn't installed
      const state = get();
      const currentModel = state.providerConfigs.ollama.model;
      if (models.length > 0 && !models.includes(currentModel)) {
        const nextConfigs = {
          ...state.providerConfigs,
          ollama: { ...state.providerConfigs.ollama, model: models[0] },
        };
        set({
          providerConfigs: nextConfigs,
          ...(state.selectedProvider === "ollama"
            ? { selectedModel: models[0] }
            : {}),
        });
        void persistProviderConfigs(nextConfigs);
        if (state.selectedProvider === "ollama") {
          localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, models[0]);
        }
      }
    } catch {
      set({ ollamaStatus: "disconnected", ollamaModels: [] });
    } finally {
      ollamaCheckPromise = null;
    }
    })();

    return ollamaCheckPromise;
  },

  fetchGithubCopilotModels: async () => {
    const accessToken = get().providerConfigs["github-copilot"].apiKey;
    if (!accessToken) return;

    try {
      const models = await githubCopilotProvider.fetchModels!(accessToken);
      set({ githubCopilotModels: models, githubCopilotError: null });

      // Auto-select first model if current model isn't in the list
      const state = get();
      const currentModel = state.providerConfigs["github-copilot"].model;
      if (models.length > 0 && !models.includes(currentModel)) {
        const nextConfigs = {
          ...state.providerConfigs,
          "github-copilot": {
            ...state.providerConfigs["github-copilot"],
            model: models[0],
          },
        };
        set({
          providerConfigs: nextConfigs,
          ...(state.selectedProvider === "github-copilot"
            ? { selectedModel: models[0] }
            : {}),
        });
        void persistProviderConfigs(nextConfigs);
        if (state.selectedProvider === "github-copilot") {
          localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, models[0]);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load Copilot models.";

      if (message.includes("401")) {
        await get().clearGithubCopilotConnection(
          "Your GitHub Copilot session expired. Connect again to reload models."
        );
        return;
      }

      set({
        githubCopilotModels: [],
        githubCopilotError: message,
      });
    }
  },
}));
