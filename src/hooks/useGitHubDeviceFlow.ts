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
// Device code + token polling go through local API routes to avoid CORS
// (github.com/login/* doesn't send Access-Control-Allow-Origin headers).
// api.github.com/user is CORS-friendly and can be called directly.

const DEVICE_CODE_URL = "/api/github/device/code";
const ACCESS_TOKEN_URL = "/api/github/token";
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
              await store.saveProviderConfig("github-copilot", data.access_token);
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
