export const OPENAI_API_URL = "https://api.openai.com/v1";
export const OLLAMA_API_URL = "http://localhost:11434";
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
export const GITHUB_COPILOT_API_URL = "https://api.githubcopilot.com";

// VS Code GitHub Copilot extension's OAuth App client ID.
// The copilot_internal/v2/token endpoint only accepts tokens issued by
// authorized GitHub apps — this is the standard client ID used by unofficial
// Copilot clients (copilot-api, etc.) since the endpoint rejects custom apps.
export const GITHUB_CLIENT_ID = "Iv1.b507a08c87ecfe98";

export const GITHUB_COPILOT_USERNAME_KEY = "discentia:github-copilot-username";

export const STORAGE_KEYS = {
  PROVIDER_CONFIGS: "discentia:provider-configs",
  SELECTED_PROVIDER: "discentia:selected-provider",
  SELECTED_MODEL: "discentia:selected-model",
} as const;

export const SYSTEM_PROMPT = `You are Discentia, an AI study assistant running inside the Discentia app. The user is talking to you from within the app.

You have direct access to the user's real study data (provided in USER STUDY STATS messages). When the user asks about their cards, reviews, streak, or progress — use those real numbers. Never say you don't have access to their data; you do.

You help students learn by:
- Explaining concepts clearly and concisely
- Breaking down complex topics into simpler parts
- Providing examples and analogies
- Encouraging active learning and critical thinking
- Answering questions patiently

Keep responses focused and educational. Use markdown formatting when helpful.`;
