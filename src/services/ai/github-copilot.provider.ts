import type {
  AIServiceProvider,
  AIMessage,
  ProviderConfig,
  StreamCallbacks,
} from "@/types/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import { GITHUB_COPILOT_API_URL } from "@/lib/constants";

// ── Session token cache (module-level, shared across calls) ──

interface SessionCache {
  token: string;
  expiresAt: number; // unix seconds as returned by GitHub
}

let sessionCache: SessionCache | null = null;

async function fetchSessionToken(accessToken: string): Promise<SessionCache> {
  const response = await fetch("/api/github/copilot/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      body.error ?? `Failed to get Copilot session token: ${response.status}`
    );
  }

  return (await response.json()) as SessionCache;
}

async function fetchCopilotModels(accessToken: string): Promise<string[]> {
  const response = await fetch("/api/github/copilot/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      body.error ?? `Failed to fetch Copilot models: ${response.status}`
    );
  }

  const data = (await response.json()) as {
    data: Array<{ id: string }>;
  };

  return [...new Set(data.data.map((m) => m.id))];
}

// Required by api.githubcopilot.com
const COPILOT_HEADERS_BASE = {
  "copilot-integration-id": "vscode-chat",
  "editor-version": "vscode/1.99.0",
  "editor-plugin-version": "copilot-chat/0.26.7",
  "user-agent": "GitHubCopilotChat/0.26.7",
  "x-github-api-version": "2025-04-01",
} as const;

/**
 * Exchanges an OAuth access token for a short-lived Copilot session token.
 * Caches the result and auto-refreshes 5 minutes before expiry.
 * Note: GitHub's copilot_internal endpoint requires "token" prefix, not "Bearer".
 */
async function getSessionToken(accessToken: string): Promise<string> {
  // Use cache if valid (with 5-minute buffer)
  if (
    sessionCache &&
    Date.now() < (sessionCache.expiresAt - 300) * 1000
  ) {
    return sessionCache.token;
  }

  const data = await fetchSessionToken(accessToken);
  sessionCache = data;
  return data.token;
}

// ── Provider ──

export const githubCopilotProvider: AIServiceProvider = {
  type: "github-copilot",
  displayName: PROVIDER_DEFAULTS["github-copilot"].displayName,
  models: PROVIDER_DEFAULTS["github-copilot"].models,
  defaultModel: PROVIDER_DEFAULTS["github-copilot"].defaultModel,

  async fetchModels(accessToken: string): Promise<string[]> {
    return fetchCopilotModels(accessToken);
  },

  async sendMessage(
    messages: AIMessage[],
    config: ProviderConfig,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    let fullText = "";

    try {
      const doFetch = async (token: string) =>
        fetch(`${GITHUB_COPILOT_API_URL}/chat/completions`, {
          method: "POST",
          headers: {
            ...COPILOT_HEADERS_BASE,
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "openai-intent": "conversation-panel",
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
      let buffer = "";

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
      // Handle abort at any phase (pre-stream fetch, 401 retry, or during streaming)
      if (signal?.aborted) {
        callbacks.onComplete(fullText);
        return;
      }
      throw error;
    }
  },

  async validateApiKey(accessToken: string): Promise<boolean> {
    try {
      await fetchCopilotModels(accessToken);
      return true;
    } catch {
      return false;
    }
  },
};
