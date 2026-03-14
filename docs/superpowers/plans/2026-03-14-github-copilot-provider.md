# GitHub Copilot Provider Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GitHub Models provider with a GitHub Copilot provider that authenticates via OAuth Device Flow and lists models dynamically at runtime.

**Architecture:** A new `github-copilot.provider.ts` handles session token exchange (PAT → short-lived Copilot token, cached in module scope) and exposes `fetchModels` via the extended `AIServiceProvider` interface. A `useGitHubDeviceFlow` hook drives the OAuth flow. The store gains `githubCopilotModels` following the Ollama pattern. A `GitHubCopilotConnect` component renders the connection UI in settings.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, Zustand, Tailwind CSS v4, shadcn/ui, motion/react, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-13-github-copilot-provider-design.md`

---

## ⚠️ Prerequisite — Register GitHub OAuth App

Before writing any code, the developer must do this once:

1. Go to **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Fill in:
   - Application name: `Discentia`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000` (unused but required)
3. ✅ Check **"Enable Device Flow"**
4. Click **Register Application**
5. Copy the **Client ID** (looks like `Ov23liXXXXXXXXXX`)
6. Leave the page open — you'll add this to `constants.ts` in Task 1

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Edit | `src/lib/constants.ts` | GITHUB_CLIENT_ID, GITHUB_COPILOT_API_URL, GITHUB_COPILOT_USERNAME_KEY |
| Edit | `src/types/ai.ts` | Rename type, update PROVIDER_DEFAULTS, add fetchModels to interface |
| Create | `src/services/ai/github-copilot.provider.ts` | Session token cache, fetchModels, sendMessage, validateApiKey |
| Delete | `src/services/ai/github-models.provider.ts` | Replaced |
| Edit | `src/services/ai/index.ts` | Swap import |
| Edit | `src/stores/provider.store.ts` | githubCopilotModels, fetchGithubCopilotModels, migration, defaultConfigs |
| Create | `src/hooks/useGitHubDeviceFlow.ts` | Device Flow state machine, recursive setTimeout polling |
| Create | `src/components/providers/GitHubCopilotConnect.tsx` | Connect/waiting/connected UI, model selector |
| Edit | `src/components/providers/SettingsPage.tsx` | Swap provider entry, render GitHubCopilotConnect for copilot |
| Edit | `src/components/providers/SettingsDialog.tsx` | Replace github-models literals + add github-copilot branch rendering GitHubCopilotConnect |
| Edit | `src/components/providers/AIProviderSelector.tsx` | Update provider entry, add copilot branch to getModelsForProvider |

---

## Chunk 1: Foundation — Types, Constants, Provider, Index

### Task 1: Add constants

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add Copilot constants**

Replace the full file content:

```ts
export const OPENAI_API_URL = "https://api.openai.com/v1";
export const OLLAMA_API_URL = "http://localhost:11434";
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
export const GITHUB_COPILOT_API_URL = "https://api.githubcopilot.com";

// Register your OAuth App at github.com/settings/developers
// Enable "Device Flow" on the app — client_secret is NOT needed for Device Flow
export const GITHUB_CLIENT_ID = ""; // ← paste your Client ID here

export const GITHUB_COPILOT_USERNAME_KEY = "discentia:github-copilot-username";

export const STORAGE_KEYS = {
  PROVIDER_CONFIGS: "discentia:provider-configs",
  SELECTED_PROVIDER: "discentia:selected-provider",
  SELECTED_MODEL: "discentia:selected-model",
} as const;

export const SYSTEM_PROMPT = `You are a helpful AI study assistant called Discentia. You help students learn by:
- Explaining concepts clearly and concisely
- Breaking down complex topics into simpler parts
- Providing examples and analogies
- Encouraging active learning and critical thinking
- Answering questions patiently

Keep responses focused and educational. Use markdown formatting when helpful.`;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add GitHub Copilot API constants"
```

---

### Task 2: Update types

**Files:**
- Modify: `src/types/ai.ts`

- [ ] **Step 1: Rename type, update defaults, extend interface**

Replace the full file content:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only about `"github-models"` references in other files (not yet updated). That's fine — they'll be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/ai.ts
git commit -m "feat: rename github-models → github-copilot type, add fetchModels to AIServiceProvider"
```

---

### Task 3: Create the GitHub Copilot provider

**Files:**
- Create: `src/services/ai/github-copilot.provider.ts`

- [ ] **Step 1: Write the provider**

```ts
import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { GITHUB_COPILOT_API_URL } from "@/lib/constants";

const GITHUB_API_URL = "https://api.github.com";

// ── Session token cache (module-level, shared across calls) ──

interface SessionCache {
  token: string;
  expiresAt: number; // unix seconds as returned by GitHub
}

let sessionCache: SessionCache | null = null;

// Required by api.githubcopilot.com — returns 400/403 without these
const COPILOT_HEADERS_BASE = {
  "Editor-Version": "vscode/1.95.0",
  "Editor-Plugin-Version": "copilot/1.256.0",
  "Copilot-Integration-Id": "vscode-chat",
  "User-Agent": "GithubCopilot/1.256.0",
} as const;

/**
 * Exchanges an OAuth access token for a short-lived Copilot session token.
 * Caches the result and auto-refreshes 5 minutes before expiry.
 */
async function getSessionToken(accessToken: string): Promise<string> {
  // Use cache if valid (with 5-minute buffer)
  if (
    sessionCache &&
    Date.now() < (sessionCache.expiresAt - 300) * 1000
  ) {
    return sessionCache.token;
  }

  const response = await fetch(
    `${GITHUB_API_URL}/copilot_internal/v2/token`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get Copilot session token: ${response.status}`
    );
  }

  const data = (await response.json()) as {
    token: string;
    expires_at: number;
  };

  sessionCache = { token: data.token, expiresAt: data.expires_at };
  return data.token;
}

// ── Provider ──

export const githubCopilotProvider: AIServiceProvider = {
  type: "github-copilot",
  displayName: PROVIDER_DEFAULTS["github-copilot"].displayName,
  models: PROVIDER_DEFAULTS["github-copilot"].models,
  defaultModel: PROVIDER_DEFAULTS["github-copilot"].defaultModel,

  async fetchModels(accessToken: string): Promise<string[]> {
    const sessionToken = await getSessionToken(accessToken);
    const response = await fetch(`${GITHUB_COPILOT_API_URL}/models`, {
      headers: {
        ...COPILOT_HEADERS_BASE,
        Authorization: `Bearer ${sessionToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Copilot models: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: Array<{ id: string }>;
    };
    return data.data.map((m) => m.id);
  },

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const doFetch = async (token: string) =>
      fetch(`${GITHUB_COPILOT_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          ...COPILOT_HEADERS_BASE,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true,
          ...(config.temperature !== undefined
            ? { temperature: config.temperature }
            : {}),
        }),
        signal,
      });

    let sessionToken = await getSessionToken(config.apiKey);
    let response = await doFetch(sessionToken);

    // 401 → clear cache and retry once with fresh token
    if (response.status === 401) {
      sessionCache = null;
      sessionToken = await getSessionToken(config.apiKey);
      response = await doFetch(sessionToken);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `GitHub Copilot API error: ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody) as {
          error?: { message?: string };
        };
        if (parsed.error?.message) errorMessage = parsed.error.message;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            callbacks.onComplete(fullText);
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
          } catch {
            // skip malformed JSON chunks
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      if (signal?.aborted) {
        callbacks.onComplete(fullText);
        return;
      }
      throw error;
    }
  },

  async validateApiKey(accessToken: string): Promise<boolean> {
    try {
      // Clears cached token first to force a fresh exchange
      sessionCache = null;
      await getSessionToken(accessToken);
      return true;
    } catch {
      return false;
    }
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai/github-copilot.provider.ts
git commit -m "feat: add GitHub Copilot provider with token exchange and dynamic model fetch"
```

---

### Task 4: Update AI service index

**Files:**
- Modify: `src/services/ai/index.ts`

- [ ] **Step 1: Swap the import**

Replace the full file content:

```ts
import type { AIProviderType, AIServiceProvider } from "@/types/ai";
import { openaiProvider } from "./openai.provider";
import { ollamaProvider } from "./ollama.provider";
import { openrouterProvider } from "./openrouter.provider";
import { anthropicProvider } from "./anthropic.provider";
import { githubCopilotProvider } from "./github-copilot.provider";

const providers: Map<AIProviderType, AIServiceProvider> = new Map([
  ["openai", openaiProvider],
  ["ollama", ollamaProvider],
  ["openrouter", openrouterProvider],
  ["anthropic", anthropicProvider],
  ["github-copilot", githubCopilotProvider],
]);

export function getAIProvider(
  type: AIProviderType
): AIServiceProvider | undefined {
  return providers.get(type);
}

export function getAvailableProviders(): AIServiceProvider[] {
  return Array.from(providers.values());
}
```

- [ ] **Step 2: Delete old provider file**

```bash
rm /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat/src/services/ai/github-models.provider.ts
```

- [ ] **Step 3: Verify compilation (will still have errors in store/components — that's expected)**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | grep -v "github-models" | head -20
```

Expected: errors only in `provider.store.ts`, `SettingsPage.tsx`, `SettingsDialog.tsx`, `AIProviderSelector.tsx` — all about `"github-models"` literals. Those are fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/services/ai/index.ts
git rm src/services/ai/github-models.provider.ts
git commit -m "feat: swap github-models import for github-copilot in AI service registry"
```

---

## Chunk 2: State Layer — Store + Device Flow Hook

### Task 5: Update provider store

**Files:**
- Modify: `src/stores/provider.store.ts`

- [ ] **Step 1: Write the updated store**

Replace the full file content:

```ts
import { create } from "zustand";
import type { AIProviderType, ProviderConfig } from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { encrypt, decrypt } from "@/lib/crypto";
import { STORAGE_KEYS, OLLAMA_API_URL } from "@/lib/constants";
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
  gemini: { apiKey: "", model: PROVIDER_DEFAULTS.gemini.defaultModel },
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
  saveProviderConfigs: () => Promise<void>;
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
    void get().saveProviderConfigs();
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
      const raw = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIGS);
      const configs = { ...defaultConfigs };

      if (raw) {
        const encrypted: Record<
          string,
          { apiKey: string; model: string; temperature?: number; baseUrl?: string }
        > = JSON.parse(raw);

        // ── Migration: github-models → github-copilot ──
        // The old PAT is incompatible with Device Flow — the user will be
        // prompted to reconnect. We copy the key so the config slot exists;
        // validateApiKey will return false and the UI will show "reconnect".
        if (encrypted["github-models"] && !encrypted["github-copilot"]) {
          encrypted["github-copilot"] = encrypted["github-models"];
        }

        for (const [key, value] of Object.entries(encrypted)) {
          const type = key as AIProviderType;
          if (!configs[type]) continue;

          configs[type] = {
            apiKey: value.apiKey ? await decrypt(value.apiKey) : "",
            model: value.model || configs[type].model,
            temperature: value.temperature,
            baseUrl: value.baseUrl,
          };
        }
      }

      const rawProvider = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER);
      // Migrate stored "github-models" → "github-copilot"
      const migratedProvider =
        rawProvider === "github-models" ? "github-copilot" : rawProvider;
      const savedProvider = migratedProvider as AIProviderType | null;
      const selectedProvider =
        savedProvider && configs[savedProvider] ? savedProvider : "openai";
      const selectedModel =
        localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) ||
        configs[selectedProvider].model;

      set({ providerConfigs: configs, selectedProvider, selectedModel });

      // Auto-fetch Copilot models if already connected on app load
      if (
        selectedProvider === "github-copilot" &&
        configs["github-copilot"].apiKey
      ) {
        void get().fetchGithubCopilotModels();
      }
    } catch {
      // corrupted storage — start fresh
    }
  },

  saveProviderConfigs: async () => {
    const configs = get().providerConfigs;
    const encrypted: Record<
      string,
      { apiKey: string; model: string; temperature?: number; baseUrl?: string }
    > = {};

    for (const [key, value] of Object.entries(configs)) {
      encrypted[key] = {
        apiKey: value.apiKey ? await encrypt(value.apiKey) : "",
        model: value.model,
        temperature: value.temperature,
        baseUrl: value.baseUrl,
      };
    }

    localStorage.setItem(
      STORAGE_KEYS.PROVIDER_CONFIGS,
      JSON.stringify(encrypted)
    );
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
        void get().saveProviderConfigs();
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
        void get().saveProviderConfigs();
      }
    } catch {
      set({ githubCopilotModels: [] }); // silent fail — UI shows retry option
    }
  },
}));
```

- [ ] **Step 2: Verify compilation (errors should now only be in UI components)**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

Expected: errors only in `SettingsPage.tsx`, `SettingsDialog.tsx`, `AIProviderSelector.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/stores/provider.store.ts
git commit -m "feat: add githubCopilotModels state, fetchGithubCopilotModels action, and migration to provider store"
```

---

### Task 6: Create useGitHubDeviceFlow hook

**Files:**
- Create: `src/hooks/useGitHubDeviceFlow.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useProviderStore } from "@/stores/provider.store";
import { GITHUB_CLIENT_ID, GITHUB_COPILOT_USERNAME_KEY } from "@/lib/constants";

// ── Types ──

export type DeviceFlowState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "waiting"; userCode: string; verificationUri: string; expiresIn: number }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "expired" };

export interface UseGitHubDeviceFlowReturn {
  state: DeviceFlowState;
  startFlow: () => Promise<void>;
  cancel: () => void;
}

// ── GitHub Device Flow endpoints ──

const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

// ── Hook ──

export function useGitHubDeviceFlow(): UseGitHubDeviceFlowReturn {
  const [state, setState] = useState<DeviceFlowState>({ status: "idle" });
  const cancelledRef = useRef(false);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState({ status: "idle" });
  }, []);

  // Cancel polling when the component that uses this hook unmounts
  useEffect(() => {
    return () => { cancel(); };
  }, [cancel]);

  const startFlow = useCallback(async () => {
    cancelledRef.current = false;
    setState({ status: "requesting" });

    try {
      // ── Step 1: Request device code ──
      const codeRes = await fetch(DEVICE_CODE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          scope: "read:user",
        }),
      });

      if (!codeRes.ok) {
        throw new Error(`Device code request failed: ${codeRes.status}`);
      }

      const codeData = (await codeRes.json()) as {
        device_code: string;
        user_code: string;
        verification_uri: string;
        expires_in: number;
        interval: number;
      };

      const { device_code, user_code, verification_uri, expires_in } = codeData;
      let interval = codeData.interval ?? 5;

      // ── Step 2: Open browser and show waiting state ──
      window.open(verification_uri, "_blank");
      setState({
        status: "waiting",
        userCode: user_code,
        verificationUri: verification_uri,
        expiresIn: expires_in,
      });

      // ── Step 3: Poll with recursive setTimeout ──
      // Must use setTimeout (not setInterval) so the interval can be
      // dynamically increased when GitHub returns `slow_down`.
      const poll = () => {
        setTimeout(async () => {
          if (cancelledRef.current) return;

          try {
            const tokenRes = await fetch(ACCESS_TOKEN_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                device_code,
                grant_type:
                  "urn:ietf:params:oauth:grant-type:device_code",
              }),
            });

            const data = (await tokenRes.json()) as {
              access_token?: string;
              error?: string;
              error_description?: string;
            };

            if (cancelledRef.current) return;

            if (data.access_token) {
              // ── Success: fetch username and save token ──
              try {
                const userRes = await fetch(GITHUB_USER_URL, {
                  headers: {
                    Authorization: `Bearer ${data.access_token}`,
                    Accept: "application/json",
                  },
                });
                if (userRes.ok) {
                  const user = (await userRes.json()) as { login?: string };
                  localStorage.setItem(
                    GITHUB_COPILOT_USERNAME_KEY,
                    user.login ?? ""
                  );
                }
              } catch {
                // Username fetch failure is non-fatal
              }

              // Save token to store using getState() to avoid stale closure
              const store = useProviderStore.getState();
              const currentConfig =
                store.providerConfigs["github-copilot"];
              store.setProviderConfig("github-copilot", {
                ...currentConfig,
                apiKey: data.access_token,
              });
              await store.saveProviderConfigs();
              await store.fetchGithubCopilotModels();

              setState({ status: "success" });
            } else if (data.error === "slow_down") {
              interval += 5; // increase polling interval as required
              poll();
            } else if (data.error === "authorization_pending") {
              poll(); // keep waiting
            } else if (data.error === "expired_token") {
              setState({ status: "expired" });
            } else {
              setState({
                status: "error",
                message:
                  data.error_description ??
                  data.error ??
                  "Authorization failed",
              });
            }
          } catch (err) {
            if (!cancelledRef.current) {
              setState({
                status: "error",
                message:
                  err instanceof Error ? err.message : "Network error",
              });
            }
          }
        }, interval * 1000);
      };

      poll();
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to start authorization",
      });
    }
  }, []); // empty deps — reads store via getState() to avoid stale closures

  return { state, startFlow, cancel };
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

Expected: same UI-component errors as before, hook itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGitHubDeviceFlow.ts
git commit -m "feat: add useGitHubDeviceFlow hook with recursive setTimeout polling"
```

---

## Chunk 3: UI Layer — Components and Settings

### Task 7: Create GitHubCopilotConnect component

**Files:**
- Create: `src/components/providers/GitHubCopilotConnect.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Github,
  ExternalLink,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useGitHubDeviceFlow } from "@/hooks/useGitHubDeviceFlow";
import { useProviderStore } from "@/stores/provider.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GITHUB_COPILOT_USERNAME_KEY } from "@/lib/constants";

export function GitHubCopilotConnect() {
  const {
    providerConfigs,
    setProviderConfig,
    githubCopilotModels,
    fetchGithubCopilotModels,
    saveProviderConfigs,
  } = useProviderStore();

  const config = providerConfigs["github-copilot"];
  const isConnected = config.apiKey.length > 0;

  const [username, setUsername] = useState<string>("");
  const { state, startFlow, cancel } = useGitHubDeviceFlow();

  // Load stored username when connection state changes
  useEffect(() => {
    if (isConnected) {
      const stored = localStorage.getItem(GITHUB_COPILOT_USERNAME_KEY);
      setUsername(stored ?? "");
    }
  }, [isConnected]);

  // Fetch models once on mount if already connected but models not yet loaded.
  // Only depends on isConnected — NOT on githubCopilotModels.length — to avoid
  // an infinite loop when fetchGithubCopilotModels fails silently and returns [].
  useEffect(() => {
    if (isConnected) {
      void fetchGithubCopilotModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleDisconnect = () => {
    setProviderConfig("github-copilot", { ...config, apiKey: "", model: "" });
    localStorage.removeItem(GITHUB_COPILOT_USERNAME_KEY);
    // Clear the dynamic model list so the provider selector shows no models
    useProviderStore.setState({ githubCopilotModels: [] });
    void saveProviderConfigs();
  };

  const handleModelChange = (model: string) => {
    setProviderConfig("github-copilot", { ...config, model });
    void saveProviderConfigs();
  };

  // ── Connected ──
  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
            {username && (
              <span className="text-xs text-[#888]">@{username}</span>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut size={12} />
            Disconnect
          </button>
        </div>

        {githubCopilotModels.length > 0 ? (
          <div>
            <Label className="text-xs font-medium text-[#555] block mb-1.5">
              Model
            </Label>
            <Select
              value={
                githubCopilotModels.includes(config.model)
                  ? config.model
                  : githubCopilotModels[0]
              }
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {githubCopilotModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-[#888]" />
            <span className="text-xs text-[#888]">Loading models...</span>
            <button
              onClick={() => void fetchGithubCopilotModels()}
              className="ml-auto text-xs text-[#888] hover:text-[#555] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Waiting for user to enter code on GitHub ──
  if (state.status === "waiting") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-[#555]">
          Enter the code below at{" "}
          <strong>github.com/login/device</strong>
        </p>
        <div className="flex items-center gap-3">
          <div className="font-mono text-base font-bold tracking-widest text-[#111] bg-[#F3F4F6] px-4 py-2 rounded-lg select-all">
            {state.userCode}
          </div>
          <a
            href={state.verificationUri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#111] text-white rounded-lg hover:bg-[#222] transition-colors"
          >
            Open GitHub
            <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-[#888]" />
          <span className="text-xs text-[#888]">
            Waiting for authorization...
          </span>
          <button
            onClick={cancel}
            className="ml-auto text-xs text-[#888] hover:text-[#555] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / error / expired — show connect button ──
  const errorMessage =
    state.status === "error"
      ? state.message
      : state.status === "expired"
      ? "Code expired — try again"
      : null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => void startFlow()}
        disabled={state.status === "requesting"}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[#111] text-white rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {state.status === "requesting" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Github size={12} />
        )}
        {state.status === "requesting"
          ? "Starting..."
          : "Connect with GitHub"}
        {state.status === "idle" && <ExternalLink size={12} />}
      </button>

      {errorMessage && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>✗</span> {errorMessage}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/providers/GitHubCopilotConnect.tsx
git commit -m "feat: add GitHubCopilotConnect component with Device Flow UI"
```

---

### Task 8: Update SettingsPage

**Files:**
- Modify: `src/components/providers/SettingsPage.tsx`

- [ ] **Step 1: Update providerDisplays entry**

In `src/components/providers/SettingsPage.tsx`, locate the `providerDisplays` array and replace the `github-models` entry:

```ts
// BEFORE:
{
  type: "github-models",
  lobeProvider: "github",
  description: "Access models from GitHub's free AI model marketplace.",
  comingSoon: false,
},

// AFTER:
{
  type: "github-copilot",
  lobeProvider: "github",
  description: "GitHub Copilot Chat — GPT-4o, o1, Claude, Gemini and more with your Copilot subscription.",
  comingSoon: false,
},
```

- [ ] **Step 2: Add GitHubCopilotConnect import**

Near the top of the file, add the import alongside the other component imports:

```ts
import { GitHubCopilotConnect } from "@/components/providers/GitHubCopilotConnect";
```

- [ ] **Step 3: Add github-copilot branch in ProviderRow expanded content**

Inside `ProviderRow`, find the expanded content section. It currently has:

```tsx
{isOllama ? (
  // ... Ollama UI ...
) : (
  // ... standard API key UI ...
)}
```

Replace it with a three-way branch:

```tsx
{isOllama ? (
  // ... existing Ollama UI — no change ...
) : display.type === "github-copilot" ? (
  <GitHubCopilotConnect />
) : (
  // ... existing standard API key UI — no change ...
)}
```

- [ ] **Step 4: Verify compilation**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

Expected: errors only in `SettingsDialog.tsx` and `AIProviderSelector.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/providers/SettingsPage.tsx
git commit -m "feat: update SettingsPage to use GitHubCopilotConnect for github-copilot provider"
```

---

### Task 9: Update SettingsDialog

**Files:**
- Modify: `src/components/providers/SettingsDialog.tsx`

Two changes: fix the `"github-models"` literals (TypeScript errors), and replace the standard API key input for `github-copilot` with `<GitHubCopilotConnect />`.

- [ ] **Step 1: Add import for GitHubCopilotConnect**

At the top of `SettingsDialog.tsx`, add:

```ts
import { GitHubCopilotConnect } from "@/components/providers/GitHubCopilotConnect";
```

- [ ] **Step 2: Update providerOrder**

```ts
// BEFORE:
const providerOrder: AIProviderType[] = ["ollama", "openai", "openrouter", "github-models", "anthropic", "gemini"];

// AFTER:
const providerOrder: AIProviderType[] = ["ollama", "openai", "openrouter", "github-copilot", "anthropic", "gemini"];
```

- [ ] **Step 3: Update localKeys initializer**

```ts
// BEFORE:
const [localKeys, setLocalKeys] = useState<Record<AIProviderType, string>>({
  openai: "", anthropic: "", gemini: "", ollama: "", openrouter: "", "github-models": "",
});

// AFTER:
const [localKeys, setLocalKeys] = useState<Record<AIProviderType, string>>({
  openai: "", anthropic: "", gemini: "", ollama: "", openrouter: "", "github-copilot": "",
});
```

- [ ] **Step 4: Update results initializer**

```ts
// BEFORE:
const [results, setResults] = useState<...>(
  { openai: null, anthropic: null, gemini: null, ollama: null, openrouter: null, "github-models": null }
);

// AFTER:
const [results, setResults] = useState<...>(
  { openai: null, anthropic: null, gemini: null, ollama: null, openrouter: null, "github-copilot": null }
);
```

- [ ] **Step 5: Update handleOpenChange**

```ts
// Inside setLocalKeys call — BEFORE:
"github-models": providerConfigs["github-models"].apiKey,

// AFTER:
"github-copilot": providerConfigs["github-copilot"].apiKey,

// Inside setResults call — BEFORE:
"github-models": null

// AFTER:
"github-copilot": null
```

- [ ] **Step 6: Add github-copilot branch in the render loop**

Inside the `providerOrder.map(...)` render, the dialog currently handles Ollama specially and then falls through to a standard `<Input>` form. Add a branch before the standard form so GitHub Copilot renders `<GitHubCopilotConnect />` instead:

```tsx
// Inside providerOrder.map((type) => { ... })

// Ollama: special UI (no API key, just connection test)
if (type === "ollama") {
  return ( /* ... existing Ollama JSX, no change ... */ );
}

// GitHub Copilot: OAuth Device Flow — no API key input
if (type === "github-copilot") {
  return (
    <div key={type} className="flex flex-col gap-2">
      <Label className="text-sm font-medium">
        {PROVIDER_DEFAULTS[type].displayName}
      </Label>
      <GitHubCopilotConnect />
    </div>
  );
}

// Standard API key provider (existing JSX — no change)
return ( /* ... existing standard form ... */ );
```

- [ ] **Step 7: Verify compilation**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

Expected: errors only in `AIProviderSelector.tsx`.

- [ ] **Step 8: Commit**

```bash
git add src/components/providers/SettingsDialog.tsx
git commit -m "fix: update SettingsDialog for github-copilot — fix literals and render GitHubCopilotConnect"
```

---

### Task 10: Update AIProviderSelector

**Files:**
- Modify: `src/components/providers/AIProviderSelector.tsx`

Three changes: provider entry, `getModelsForProvider`, and store destructure.

- [ ] **Step 1: Update the providers array entry**

```ts
// BEFORE:
{
  id: "github-models" as AIProviderType,
  name: "GitHub Models",
  lobeProvider: "github",
  badgeLabel: "GitHub",
  badgeBg: "#F0FDF4",
  badgeText: "#166534",
},

// AFTER:
{
  id: "github-copilot" as AIProviderType,
  name: "GitHub Copilot",
  lobeProvider: "github",
  badgeLabel: "Copilot",
  badgeBg: "#F0FDF4",
  badgeText: "#166534",
},
```

- [ ] **Step 2: Add githubCopilotModels to store destructure**

```ts
// BEFORE:
const {
  selectedProvider,
  setSelectedProvider,
  selectedModel,
  setSelectedModel,
  ollamaModels,
  checkOllamaConnection,
} = useProviderStore();

// AFTER:
const {
  selectedProvider,
  setSelectedProvider,
  selectedModel,
  setSelectedModel,
  ollamaModels,
  checkOllamaConnection,
  githubCopilotModels,
  fetchGithubCopilotModels,
} = useProviderStore();
```

- [ ] **Step 3: Add Copilot branch to getModelsForProvider**

```ts
// BEFORE:
const getModelsForProvider = (id: AIProviderType): string[] => {
  if (id === "ollama") return ollamaModels;
  return PROVIDER_DEFAULTS[id].models;
};

// AFTER:
const getModelsForProvider = (id: AIProviderType): string[] => {
  if (id === "ollama") return ollamaModels;
  if (id === "github-copilot") return githubCopilotModels;
  return PROVIDER_DEFAULTS[id].models;
};
```

- [ ] **Step 4: Fetch Copilot models when selector opens**

Inside the existing `useEffect` that calls `checkOllamaConnection` on `isOpen`:

```ts
// BEFORE:
useEffect(() => {
  if (isOpen) {
    checkOllamaConnection();
  }
}, [isOpen, checkOllamaConnection]);

// AFTER:
useEffect(() => {
  if (isOpen) {
    checkOllamaConnection();
    if (selectedProvider === "github-copilot") {
      void fetchGithubCopilotModels();
    }
  }
}, [isOpen, checkOllamaConnection, selectedProvider, fetchGithubCopilotModels]);
```

- [ ] **Step 5: Verify full TypeScript compilation — should be zero errors**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npx tsc --noEmit 2>&1
```

Expected: **no errors**.

- [ ] **Step 6: Run lint**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npm run lint 2>&1 | tail -20
```

Expected: no errors or warnings related to changed files.

- [ ] **Step 7: Commit**

```bash
git add src/components/providers/AIProviderSelector.tsx
git commit -m "feat: update AIProviderSelector for github-copilot with dynamic model list"
```

---

### Task 11: Manual smoke test

- [ ] **Step 1: Add your Client ID to constants**

Open `src/lib/constants.ts` and paste your GitHub OAuth App Client ID:

```ts
export const GITHUB_CLIENT_ID = "Ov23liYOUR_CLIENT_ID_HERE";
```

- [ ] **Step 2: Start dev server**

```bash
cd /Users/mwerneck/web-discentia/.claude/worktrees/sleepy-fermat
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 3: Test Device Flow**

1. Open Settings → AI Providers → GitHub Copilot
2. Expand the card
3. Click **"Connect with GitHub"**
4. A browser tab should open at `github.com/login/device`
5. A code like `ABCD-1234` should appear in the settings panel
6. Enter the code on GitHub and authorize
7. Settings should transition to **Connected** state showing your `@username`
8. A model dropdown should appear populated with Copilot models

- [ ] **Step 4: Test model selector in chat**

1. Open the AI provider selector (bottom of sidebar)
2. Select GitHub Copilot
3. The model sub-selector should expand showing the dynamic model list
4. Send a test message — verify the response streams correctly

- [ ] **Step 5: Test disconnect**

1. In Settings → GitHub Copilot, click **Disconnect**
2. Card should return to disconnected state
3. Provider selector should show no models for Copilot

- [ ] **Step 6: Final commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add GitHub OAuth client ID to constants"
```

---

### Task 12: Final cleanup commit

- [ ] **Step 1: Verify git status is clean**

```bash
git status
```

Expected: clean working tree.

- [ ] **Step 2: Tag the feature complete**

```bash
git log --oneline -10
```

Review the commits. If they look good, you're done.
