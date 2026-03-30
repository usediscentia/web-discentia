"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app.store";
import { useProviderStore } from "@/stores/provider.store";
import { getAIProvider } from "@/services/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GitHubCopilotConnect } from "@/components/providers/GitHubCopilotConnect";

const providerOrder: AIProviderType[] = ["ollama", "openai", "openrouter", "github-copilot", "anthropic"];

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useAppStore();
  const { providerConfigs, setProviderConfig, ollamaStatus, ollamaModels, checkOllamaConnection } =
    useProviderStore();

  const [localKeys, setLocalKeys] = useState<Record<AIProviderType, string>>({
    openai: "",
    anthropic: "",
    ollama: "",
    openrouter: "",
    "github-copilot": "",
  });
  const [testing, setTesting] = useState<AIProviderType | null>(null);
  const [results, setResults] = useState<
    Record<AIProviderType, "success" | "error" | null>
  >({ openai: null, anthropic: null, ollama: null, openrouter: null, "github-copilot": null });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalKeys({
        openai: providerConfigs.openai.apiKey,
        anthropic: providerConfigs.anthropic.apiKey,
        ollama: "",
        openrouter: providerConfigs.openrouter.apiKey,
        "github-copilot": providerConfigs["github-copilot"].apiKey,
      });
      setResults({ openai: null, anthropic: null, ollama: null, openrouter: null, "github-copilot": null });
      checkOllamaConnection();
    }
    setSettingsOpen(open);
  };

  const handleSaveAndTest = async (type: AIProviderType) => {
    const apiKey = localKeys[type].trim();

    // For providers that require API key, bail if empty
    if (PROVIDER_DEFAULTS[type].requiresApiKey && !apiKey) return;

    setTesting(type);
    setResults((prev) => ({ ...prev, [type]: null }));

    // Save key to store (skip for ollama)
    if (type !== "ollama") {
      setProviderConfig(type, {
        ...providerConfigs[type],
        apiKey,
      });
    }

    const provider = getAIProvider(type);
    if (!provider) {
      setResults((prev) => ({ ...prev, [type]: "error" }));
      setTesting(null);
      return;
    }

    const valid = await provider.validateApiKey(apiKey);
    setResults((prev) => ({ ...prev, [type]: valid ? "success" : "error" }));
    setTesting(null);

    if (valid && type !== "ollama") {
      setTimeout(() => {
        void useProviderStore.getState().saveProviderConfig(type, apiKey);
      }, 0);
    }

    if (type === "ollama") {
      checkOllamaConnection();
    }
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Provider Settings</DialogTitle>
          <DialogDescription>
            Configure your AI providers. API keys are encrypted
            and stored locally on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-2">
          {providerOrder.map((type) => {
            const defaults = PROVIDER_DEFAULTS[type];
            const provider = getAIProvider(type);
            const isComingSoon = !provider;
            const result = results[type];
            const isTesting = testing === type;

            // Ollama: special UI (no API key, just connection test)
            if (type === "ollama") {
              return (
                <div key={type} className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {defaults.displayName}
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          ollamaStatus === "connected"
                            ? "bg-green-500"
                            : ollamaStatus === "disconnected"
                            ? "bg-red-400"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {ollamaStatus === "connected"
                          ? "Connected"
                          : ollamaStatus === "disconnected"
                          ? "Not running"
                          : "Not checked"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveAndTest("ollama")}
                      disabled={isTesting}
                      className="shrink-0"
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                  {result === "success" && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span>&#10003;</span> Ollama is running
                      {ollamaModels.length > 0 && (
                        <span className="text-muted-foreground ml-1">
                          — {ollamaModels.length} model{ollamaModels.length !== 1 ? "s" : ""}: {ollamaModels.join(", ")}
                        </span>
                      )}
                    </p>
                  )}
                  {result === "error" && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span>&#10007;</span> Could not connect. Make sure Ollama is running.{" "}
                      <a
                        href="https://ollama.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Get Ollama
                      </a>
                    </p>
                  )}
                </div>
              );
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

            // Standard API key provider
            return (
              <div key={type} className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  {defaults.displayName}
                  {isComingSoon && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (coming soon)
                    </span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={
                      isComingSoon
                        ? "Not available yet"
                        : `Enter ${defaults.displayName} API key`
                    }
                    value={localKeys[type]}
                    onChange={(e) =>
                      setLocalKeys((prev) => ({
                        ...prev,
                        [type]: e.target.value,
                      }))
                    }
                    disabled={isComingSoon}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveAndTest(type)}
                    disabled={isComingSoon || isTesting || !localKeys[type].trim()}
                    className="shrink-0"
                  >
                    {isTesting ? "Testing..." : "Save & Test"}
                  </Button>
                </div>
                {defaults.apiKeyDescription && (
                  <p className="text-xs text-muted-foreground">
                    {defaults.apiKeyDescription}
                  </p>
                )}
                {result === "success" && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span>&#10003;</span> Connected successfully
                  </p>
                )}
                {result === "error" && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span>&#10007;</span> Invalid API key. Please check and try
                    again.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
