import { NextRequest, NextResponse } from "next/server";
import { LM_STUDIO_API_URL } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { baseUrl?: string; [key: string]: unknown };
  const { baseUrl, ...chatBody } = body;

  const url = `${baseUrl || LM_STUDIO_API_URL}/chat/completions`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatBody),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "");
      let errorMessage = `LM Studio error: ${upstream.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) errorMessage = parsed.error.message;
      } catch {
        // use default message
      }
      return NextResponse.json({ error: errorMessage }, { status: upstream.status });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach LM Studio";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
