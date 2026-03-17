/**
 * CORS proxy for GitHub Copilot model list.
 * api.githubcopilot.com does not send CORS headers for browser requests
 * (it's designed for IDE extension use). This route proxies server-side.
 *
 * Body: { accessToken: string }
 * Returns: { data: Array<{ id: string }> } — same shape as the upstream response
 */
import { NextRequest, NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_COPILOT_API_URL = "https://api.githubcopilot.com";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { accessToken?: string };
  const accessToken = body.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 400 });
  }

  // Exchange GitHub OAuth token for a short-lived Copilot session token.
  // Note: GitHub's copilot_internal endpoint requires "token" prefix, not "Bearer".
  const sessionRes = await fetch(`${GITHUB_API_URL}/copilot_internal/v2/token`, {
    method: "GET",
    headers: {
      "authorization": `token ${accessToken}`,
      "accept": "application/json",
      "content-type": "application/json",
      "editor-version": "vscode/1.99.0",
      "editor-plugin-version": "copilot-chat/0.26.7",
      "user-agent": "GitHubCopilotChat/0.26.7",
      "x-github-api-version": "2025-04-01",
    },
  });

  if (!sessionRes.ok) {
    const text = await sessionRes.text().catch(() => "");
    console.error(`[copilot/models] session token failed ${sessionRes.status}:`, text);
    return NextResponse.json(
      { error: `Failed to get Copilot session token: ${sessionRes.status}`, detail: text },
      { status: sessionRes.status }
    );
  }

  const sessionData = (await sessionRes.json()) as { token: string };

  // Fetch model list from Copilot API
  const modelsRes = await fetch(`${GITHUB_COPILOT_API_URL}/models`, {
    method: "GET",
    headers: {
      "authorization": `Bearer ${sessionData.token}`,
      "accept": "application/json",
      "content-type": "application/json",
      "copilot-integration-id": "vscode-chat",
      "editor-version": "vscode/1.99.0",
      "editor-plugin-version": "copilot-chat/0.26.7",
      "user-agent": "GitHubCopilotChat/0.26.7",
      "x-github-api-version": "2025-04-01",
    },
  });

  if (!modelsRes.ok) {
    const text = await modelsRes.text().catch(() => "");
    console.error(`[copilot/models] models fetch failed ${modelsRes.status}:`, text);
    return NextResponse.json(
      { error: `Failed to fetch Copilot models: ${modelsRes.status}`, detail: text },
      { status: modelsRes.status }
    );
  }

  const data = (await modelsRes.json()) as unknown;
  return NextResponse.json(data, { status: 200 });
}
