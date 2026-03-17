import type { Citation } from "@/types/chat";
import type { InjectedChunk } from "@/lib/tokens";

// Handles </CITATIONS>, [/CITATIONS], or just end-of-block (AI formatting variants)
const CITATIONS_BLOCK_REGEX =
  /<CITATIONS>\s*([\s\S]*?)\s*(?:<\/CITATIONS>|\[\/CITATIONS\])/i;

// Strip any remaining <CITATIONS>...</CITATIONS> or <CITATIONS>[...] leftovers from display text
const CITATIONS_OPEN_REGEX = /<CITATIONS>[\s\S]*?(?:<\/CITATIONS>|\[\/CITATIONS\]|$)/gi;

export function stripCitationsBlock(text: string): string {
  return text.replace(CITATIONS_OPEN_REGEX, "").trim();
}

/**
 * Auto-extracts citations by comparing the AI response text against the
 * chunks that were actually injected into the context. Uses word-overlap
 * scoring so citations always point to exact text from the source document.
 *
 * For each libraryItem, picks the best-matching injected chunk. Only
 * cites an item if at least 10% of its significant words appear in the
 * response. Returns at most 3 citations, sorted by relevance.
 */
export function extractCitationsFromChunks(
  responseText: string,
  injectedChunks: InjectedChunk[]
): Citation[] {
  if (injectedChunks.length === 0) return [];

  const normalizedResponse = responseText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
  const responseWords = new Set(normalizedResponse.split(" ").filter((w) => w.length > 4));

  // Score each chunk by word overlap with the response
  const scored = injectedChunks.map((injected) => {
    const chunkWords = injected.chunk.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter((w) => w.length > 4);

    if (chunkWords.length === 0) return { score: 0, injected };

    const uniqueChunkWords = new Set(chunkWords);
    let matches = 0;
    for (const word of uniqueChunkWords) {
      if (responseWords.has(word)) matches++;
    }

    return { score: matches / uniqueChunkWords.size, injected };
  });

  // Keep best-scoring chunk per libraryItemId
  const byItem = new Map<string, { score: number; injected: InjectedChunk }>();
  for (const entry of scored) {
    const existing = byItem.get(entry.injected.libraryItemId);
    if (!existing || entry.score > existing.score) {
      byItem.set(entry.injected.libraryItemId, entry);
    }
  }

  return Array.from(byItem.values())
    .filter((entry) => entry.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ injected }) => ({
      libraryItemId: injected.libraryItemId,
      libraryId: injected.libraryId,
      itemTitle: injected.itemTitle,
      excerpt: injected.chunk.text.slice(0, 200).trim(),
      page: injected.chunk.page > 0 ? injected.chunk.page : undefined,
    }));
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
