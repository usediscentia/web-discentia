import type { Citation } from "@/types/chat";

const CITATIONS_BLOCK_REGEX =
  /<CITATIONS>\s*([\s\S]*?)\s*<\/CITATIONS>/i;

export function splitMessageAndCitations(
  text: string,
  allowedItemIds: Set<string>
): { cleanContent: string; citations: Citation[] } {
  const match = text.match(CITATIONS_BLOCK_REGEX);
  if (!match) {
    return { cleanContent: text.trim(), citations: [] };
  }

  const cleanContent = text.replace(CITATIONS_BLOCK_REGEX, "").trim();
  const rawJson = match[1].trim();
  if (!rawJson) {
    return { cleanContent, citations: [] };
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return { cleanContent, citations: [] };
    }

    const citations: Citation[] = parsed
      .filter((value) => value && typeof value === "object")
      .map((value) => ({
        libraryItemId:
          typeof value.libraryItemId === "string" ? value.libraryItemId : "",
        libraryId: typeof value.libraryId === "string" ? value.libraryId : "",
        itemTitle: typeof value.itemTitle === "string" ? value.itemTitle : "",
        excerpt: typeof value.excerpt === "string" ? value.excerpt : "",
      }))
      .filter(
        (citation) =>
          citation.libraryItemId &&
          citation.libraryId &&
          citation.itemTitle &&
          allowedItemIds.has(citation.libraryItemId)
      );

    return { cleanContent, citations };
  } catch {
    return { cleanContent, citations: [] };
  }
}
