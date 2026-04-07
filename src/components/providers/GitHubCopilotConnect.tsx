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
    githubCopilotModels,
    githubCopilotError,
    fetchGithubCopilotModels,
    clearGithubCopilotConnection,
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
    void clearGithubCopilotConnection();
  };

  const handleModelChange = (model: string) => {
    useProviderStore.getState().setProviderConfig("github-copilot", {
      ...config,
      model,
    });
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
              <span className="flex items-center gap-1.5 text-xs text-[#888]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://avatars.githubusercontent.com/${username}`}
                  alt={username}
                  className="w-4 h-4 rounded-full"
                />
                @{username}
              </span>
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
        ) : githubCopilotError ? (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/80 p-3">
            <p className="text-xs text-red-700">{githubCopilotError}</p>
            <button
              onClick={handleDisconnect}
              className="text-xs font-medium text-red-700 hover:text-red-800 transition-colors cursor-pointer"
            >
              Reconnect GitHub Copilot
            </button>
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
      : githubCopilotError;

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
