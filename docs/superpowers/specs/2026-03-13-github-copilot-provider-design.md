# GitHub Copilot Provider — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Scope:** Replace the existing "GitHub Models" provider with a fully-featured "GitHub Copilot" provider that uses OAuth Device Flow for authentication and fetches the model list dynamically at runtime.

---

## Context

The current `github-models.provider.ts` hits `models.inference.ai.azure.com` (GitHub Models free marketplace) using a manually created PAT. The goal is to replace this with the GitHub Copilot API (`api.githubcopilot.com`), which:

- Requires a paid GitHub Copilot subscription
- Exposes more models (GPT-4o, o1, Claude 3.5/3.7 Sonnet, Gemini 2.0 Flash, etc.)
- Supports dynamic model listing
- Uses a different auth flow (token exchange, not direct PAT)

---

## Decisions

| Question | Decision |
|----------|----------|
| Replace or add alongside GitHub Models? | Replace entirely |
| Static or dynamic model list? | Dynamic — fetched from `api.githubcopilot.com/models` |
| Auth UX | OAuth Device Flow (no client_secret needed) |
| `client_id` location | Hardcoded constant in `src/lib/constants.ts` |
| How to expose dynamic models in store? | Follow Ollama pattern: `githubCopilotModels` + `fetchGithubCopilotModels()` |
| Extend `AIServiceProvider` interface? | Yes — add optional `fetchModels?(apiKey: string): Promise<string[]>` |

---

## Auth Flow

### 1. OAuth Device Flow (user-facing)

```
User clicks "Conectar com GitHub"
  → POST https://github.com/login/device/code
      body: { client_id: GITHUB_CLIENT_ID, scope: "read:user" }
      Note: "copilot" is NOT a valid OAuth scope. Access to the Copilot API is
      gated by the client_id being registered as a Copilot app + the user's
      active subscription. scope: "read:user" is sufficient.
  ← { device_code, user_code, verification_uri, expires_in, interval }

App shows user_code ("ABCD-1234") + "Abrir GitHub" button
  → opens verification_uri in browser
  → polls every `interval` seconds:
      POST https://github.com/login/oauth/access_token
        body: { client_id, device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" }

Polling responses:
  - authorization_pending → keep polling
  - slow_down → increment interval by 5s, keep polling
  - access_token → done, store encrypted via crypto.ts
  - expired_token → show error, allow retry
```

The resulting `access_token` is stored encrypted in `providerConfigs["github-copilot"].apiKey` — same slot as other providers' API keys.

### 2. Copilot Session Token Exchange (internal, transparent)

The Copilot API does not accept the OAuth access token directly. On each API call, the provider exchanges it for a short-lived session token:

```
GET https://api.github.com/copilot_internal/v2/token
  Authorization: Bearer <access_token>
← { token: "<session_token>", expires_at: <unix_timestamp> }
```

- Cache: `{ token, expiresAt }` in a module-level variable inside the provider
- Refresh condition: `Date.now() >= (expires_at - 300) * 1000` — where `expires_at` is unix seconds and `300` = 5 minutes in seconds
- The rest of the app (store, hooks, UI) never sees the session token

---

## Interface Extension

Add to `AIServiceProvider` in `src/types/ai.ts`:

```ts
fetchModels?: (apiKey: string) => Promise<string[]>;
```

Optional — existing providers (`openai`, `anthropic`, `ollama`, `openrouter`) are unaffected. The store calls this when connecting the Copilot provider and after reconnects.

---

## Provider Implementation

**File:** `src/services/ai/github-copilot.provider.ts`

Internal helpers:
- `getSessionToken(accessToken: string): Promise<string>` — exchanges token, uses cache
- Exports `githubCopilotProvider: AIServiceProvider`

Public methods:
- `fetchModels(accessToken)` — gets session token → `GET /models` → returns `string[]`
- `sendMessage(messages, config, callbacks, signal)` — gets session token → `POST /chat/completions` → SSE streaming (identical pattern to current implementation)
- `validateApiKey(accessToken)` — attempts session token exchange; returns `true` if successful

**Required headers on every request to `api.githubcopilot.com`:**

```ts
const COPILOT_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionToken}`,
  "Editor-Version": "vscode/1.95.0",
  "Editor-Plugin-Version": "copilot/1.256.0",
  "Copilot-Integration-Id": "vscode-chat",
  "User-Agent": "GithubCopilot/1.256.0",
};
```

Without these headers the API returns 400 or 403. Define as a module-level constant and use in `sendMessage`, `fetchModels`, and any other fetch call to `api.githubcopilot.com`.

**Streaming** stays identical to current `github-models.provider.ts` — the changes are: endpoint, bearer token (session token instead of PAT), and the required Copilot headers above.

---

## Store Changes

In `src/stores/provider.store.ts`:

```ts
// New state
githubCopilotModels: string[]

// New action
fetchGithubCopilotModels: () => Promise<void>
  → calls githubCopilotProvider.fetchModels(config.apiKey)
  → on success: set({ githubCopilotModels: models })
  → on error: set({ githubCopilotModels: [] }) — silent fail, no crash
```

Called automatically when:
1. User completes Device Flow (access token saved)
2. App loads and `selectedProvider === "github-copilot"` with a stored token

Model selector in settings uses `githubCopilotModels` when provider is `"github-copilot"`.

---

## Types Update

In `src/types/ai.ts`:

- `AIProviderType`: replace `"github-models"` with `"github-copilot"`
- `PROVIDER_DEFAULTS["github-copilot"]`:
  ```ts
  {
    displayName: "GitHub Copilot",
    models: [],           // empty — populated dynamically
    defaultModel: "",     // set after first fetchModels
    requiresApiKey: true,
    apiKeyDescription: "Conecte sua conta GitHub com Copilot ativo"
  }
  ```

**Breaking change:** stored `selectedProvider: "github-models"` in localStorage becomes invalid.

**Migration in `loadProviderConfigs`:**
1. If `encrypted["github-models"]` exists and `encrypted["github-copilot"]` does not → copy the entry to `configs["github-copilot"]` before iteration
2. If `savedProvider === "github-models"` → treat as `"github-copilot"`
3. **Important:** the migrated `apiKey` was a plain PAT, not an OAuth access token — it is incompatible with the Device Flow auth. After migration, the component should detect that the stored token fails `validateApiKey` and render the "Reconecte sua conta" state instead of "Conectado", prompting the user to go through Device Flow once.

---

## New Hook: `useGitHubDeviceFlow`

**File:** `src/hooks/useGitHubDeviceFlow.ts`

```ts
type DeviceFlowState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "waiting"; userCode: string; verificationUri: string; expiresIn: number }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "expired" }

interface UseGitHubDeviceFlowReturn {
  state: DeviceFlowState
  startFlow: () => Promise<void>
  cancel: () => void
}
```

- `startFlow()`: requests device code, transitions to `waiting`, opens `verificationUri`, starts polling
- **Polling uses a recursive `setTimeout` pattern** (NOT `setInterval`) — this is required because the `slow_down` response mandates a dynamic interval increase. A fixed `setInterval` cannot be reconfigured in place; `setTimeout` restarts itself with the updated interval after each response:
  ```ts
  const poll = () => {
    setTimeout(async () => {
      const result = await checkToken();
      if (result === "slow_down") { interval += 5; poll(); }
      else if (result === "authorization_pending") { poll(); }
      else if (result === "access_token") { onSuccess(result.token); }
      else { onError(result); }
    }, interval * 1000);
  };
  ```
- `cancel()`: sets a `cancelled` ref to `true` (checked at the start of each `setTimeout` callback), resets state to `idle`
- **`useEffect` cleanup must call `cancel()`** to prevent the timeout from firing after unmount
- On `access_token`: saves via `setProviderConfig`, calls `fetchGithubCopilotModels`, transitions to `success`

---

## New Component: `GitHubCopilotConnect`

**File:** `src/components/providers/GitHubCopilotConnect.tsx`

Rendered inside the GitHub Copilot `ProviderRow` in SettingsPage, replacing the API key input field.

**States:**

**Disconnected:**
```
[ Conectar com GitHub  ↗ ]
```

**Connecting (waiting state):**
```
┌─────────────────────────────────────────┐
│  Entre o código em github.com/login/device
│
│  ┌──────────────┐   [ Abrir GitHub ↗ ]
│  │  ABCD-1234   │
│  └──────────────┘
│
│  ⟳ Aguardando autorização...   [ Cancelar ]
└─────────────────────────────────────────┘
```

**Connected:**
```
✓ Conectado como @username
[ Modelo: gpt-4o  ▾ ]   ← dynamic list from githubCopilotModels
[ Desconectar ]
```

`@username` is fetched once from `https://api.github.com/user` after connecting and stored in a dedicated `localStorage` key (`discentia:github-copilot-username`). Do NOT use `providerConfigs["github-copilot"].baseUrl` for this — `baseUrl` has a structural meaning (API endpoint override) and repurposing it would corrupt routing logic for any consumer that checks it.

---

## Settings Page Changes

In `src/components/providers/SettingsPage.tsx`:

- Update `providerDisplays` entry:
  ```ts
  {
    type: "github-copilot",
    lobeProvider: "github",
    description: "GitHub Copilot Chat — acesse GPT-4o, o1, Claude e Gemini com seu plano Copilot.",
    comingSoon: false,
  }
  ```
- Replace the API key `<Input>` for `github-copilot` with `<GitHubCopilotConnect />`

---

## Files Affected

| Action | File |
|--------|------|
| Create | `src/services/ai/github-copilot.provider.ts` |
| Delete | `src/services/ai/github-models.provider.ts` |
| Create | `src/hooks/useGitHubDeviceFlow.ts` |
| Create | `src/components/providers/GitHubCopilotConnect.tsx` |
| Edit | `src/types/ai.ts` |
| Edit | `src/services/ai/index.ts` |
| Edit | `src/stores/provider.store.ts` |
| Edit | `src/components/providers/SettingsPage.tsx` |
| Edit | `src/components/providers/SettingsDialog.tsx` — replace all `"github-models"` literals with `"github-copilot"` in `providerOrder`, `localKeys`, and `results` initialization |
| Edit | `src/components/providers/AIProviderSelector.tsx` — update provider entry: `id: "github-copilot"`, updated name/badge |
| Edit | `src/lib/constants.ts` |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Device code expired before user authorizes | Transition to `expired` state, show "Expirou — tente novamente" with retry button |
| Session token exchange fails (invalid/revoked token) | `validateApiKey` returns false; settings shows "Token inválido — reconecte" |
| `fetchModels` fails | `githubCopilotModels` stays `[]`; model selector shows fallback static list |
| `sendMessage` gets 401 | Clear session token cache, retry once with fresh token; if still 401, surface error to user |
| User disconnects | Clear `apiKey` from providerConfigs, clear `githubCopilotModels`, reset to `idle` |

---

## Out of Scope

- Showing GitHub username/avatar in the sidebar or chat header
- Refreshing the model list periodically (only on connect/reconnect)
- Supporting GitHub Enterprise (different base URLs)
- Migrating existing GitHub Models conversations (they continue to work read-only)
