import type { StreamCallbacks } from "@/types/ai";

export async function streamSSE(
  response: Response,
  signal: AbortSignal | undefined,
  callbacks: Pick<StreamCallbacks, "onToken" | "onComplete">
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty stream body");

  const decoder = new TextDecoder();
  const parts: string[] = [];
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          callbacks.onComplete(parts.join(""));
          return;
        }

        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            parts.push(token);
            callbacks.onToken(token);
          }
        } catch {
          // skip malformed JSON chunks
        }
      }
    }

    callbacks.onComplete(parts.join(""));
  } catch (error) {
    if (signal?.aborted) {
      callbacks.onComplete(parts.join(""));
      return;
    }
    throw error;
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}
