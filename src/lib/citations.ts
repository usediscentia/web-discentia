import type { Citation } from "@/types/chat";

// Handles </CITATIONS>, [/CITATIONS], or just end-of-block (AI formatting variants)
const CITATIONS_BLOCK_REGEX =
  /<CITATIONS>\s*([\s\S]*?)\s*(?:<\/CITATIONS>|\[\/CITATIONS\])/i;

// Strip any remaining <CITATIONS>...</CITATIONS> or <CITATIONS>[...] leftovers from display text
const CITATIONS_OPEN_REGEX = /<CITATIONS>[\s\S]*?(?:<\/CITATIONS>|\[\/CITATIONS\]|$)/gi;

export function stripCitationsBlock(text: string): string {
  return text.replace(CITATIONS_OPEN_REGEX, "").trim();
}

export function splitMessageAndCitations(
  text: string,
  allowedItemIds: Set<string>
): { cleanContent: string; citations: Citation[] } {
  const match = text.match(CITATIONS_BLOCK_REGEX);
  if (!match) {
    // Strip any leftover <CITATIONS> block even if closing tag is missing/garbled
    const cleanContent = stripCitationsBlock(text);
    return { cleanContent, citations: [] };
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
        page: typeof value.page === "number" && value.page > 0 ? value.page : undefined,
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
