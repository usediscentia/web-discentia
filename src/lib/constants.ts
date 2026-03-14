export const OPENAI_API_URL = "https://api.openai.com/v1";
export const OLLAMA_API_URL = "http://localhost:11434";
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
export const GITHUB_COPILOT_API_URL = "https://api.githubcopilot.com";

// Register your OAuth App at github.com/settings/developers
// Enable "Device Flow" on the app — client_secret is NOT needed for Device Flow
export const GITHUB_CLIENT_ID = "Ov23liSuOZ5LHnBlYQce";

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
