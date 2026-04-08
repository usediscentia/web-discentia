import { NextRequest, NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { accessToken?: string };
  const accessToken = body.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 400 });
  }

  const sessionRes = await fetch(`${GITHUB_API_URL}/copilot_internal/v2/token`, {
    method: "GET",
    headers: {
      authorization: `token ${accessToken}`,
      accept: "application/json",
      "content-type": "application/json",
      "editor-version": "vscode/1.99.0",
      "editor-plugin-version": "copilot-chat/0.26.7",
      "user-agent": "GitHubCopilotChat/0.26.7",
      "x-github-api-version": "2025-04-01",
    },
  });

  if (!sessionRes.ok) {
    const text = await sessionRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Failed to get Copilot session token: ${sessionRes.status}`, detail: text },
      { status: sessionRes.status }
    );
  }

  const sessionData = (await sessionRes.json()) as {
    token: string;
    expires_at: number;
  };

  return NextResponse.json(
    {
      token: sessionData.token,
      expiresAt: sessionData.expires_at,
    },
    { status: 200 }
  );
}
