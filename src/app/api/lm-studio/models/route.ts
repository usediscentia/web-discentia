import { NextRequest, NextResponse } from "next/server";
import { LM_STUDIO_API_URL } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.searchParams.get("baseUrl") || LM_STUDIO_API_URL;

  try {
    const res = await fetch(`${baseUrl}/models`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `LM Studio error: ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not reach LM Studio" }, { status: 503 });
  }
}
