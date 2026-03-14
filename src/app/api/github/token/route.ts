/**
 * CORS proxy for GitHub Device Flow — token polling.
 * GitHub's OAuth endpoints don't send CORS headers, so browser
 * fetch is blocked. This route proxies the request server-side.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown;
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.status });
}
