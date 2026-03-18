import type { ScoredLibraryItem } from "@/services/storage";
import type { ContentChunk } from "@/types/library";

export const DEFAULT_CONTEXT_TOKEN_BUDGET = 2200;
const MAX_CHUNKS_PER_ITEM = 5;

export interface InjectedChunk {
  libraryItemId: string;
  libraryId: string;
  itemTitle: string;
  chunk: ContentChunk;
}

export function estimateTokenCountFromChars(chars: number): number {
  return Math.ceil(chars / 4);
}

export function estimateCharBudgetFromTokens(tokens: number): number {
  return Math.max(tokens * 4, 0);
}

export function buildContextSnippet(
  items: ScoredLibraryItem[],
  maxTokens = DEFAULT_CONTEXT_TOKEN_BUDGET
): { contextText: string; usedItems: ScoredLibraryItem[]; injectedChunks: InjectedChunk[] } {
  const maxChars = estimateCharBudgetFromTokens(maxTokens);
  const selected: ScoredLibraryItem[] = [];
  const sections: string[] = [];
  const injectedChunks: InjectedChunk[] = [];
  let usedChars = 0;

  for (const entry of items) {
    const { item, matchedChunks } = entry;

    if (matchedChunks && matchedChunks.length > 0) {
      // Inject top-scoring chunks individually instead of full content
      const topChunks = matchedChunks.slice(0, MAX_CHUNKS_PER_ITEM);
      const chunkSections: string[] = [];
      const addedChunks: InjectedChunk[] = [];

      for (const { chunk } of topChunks) {
        const section = [
          `[SOURCE_START]`,
          `libraryItemId: ${item.id}`,
          `libraryId: ${item.libraryId}`,
          `title: ${item.title}`,
          chunk.heading ? `section: ${chunk.heading}` : null,
          `chunkPage: ${chunk.page}`,
          `chunkIndex: ${chunk.index}`,
          `content: ${chunk.text}`,
          `[SOURCE_END]`,
        ].filter(Boolean).join("\n");

        if (usedChars + section.length > maxChars) {
          const remaining = Math.max(maxChars - usedChars, 0);
          if (remaining < 200) break;
          const truncated = section.slice(0, remaining);
          chunkSections.push(truncated);
          usedChars += truncated.length;
          break;
        }

        chunkSections.push(section);
        addedChunks.push({ libraryItemId: item.id, libraryId: item.libraryId, itemTitle: item.title, chunk });
        usedChars += section.length;
      }

      if (chunkSections.length > 0) {
        sections.push(...chunkSections);
        injectedChunks.push(...addedChunks);
        selected.push(entry);
      }
    } else {
      // Fallback: inject whole content (legacy items or non-PDF) as a synthetic chunk
      const section = [
        `[SOURCE_START]`,
        `libraryItemId: ${item.id}`,
        `libraryId: ${item.libraryId}`,
        `title: ${item.title}`,
        `content: ${item.content}`,
        `[SOURCE_END]`,
      ].join("\n");

      if (usedChars + section.length > maxChars) {
        const remaining = Math.max(maxChars - usedChars, 0);
        if (remaining < 200) break;
        const truncated = section.slice(0, remaining);
        sections.push(truncated);
        selected.push(entry);
        injectedChunks.push({
          libraryItemId: item.id,
          libraryId: item.libraryId,
          itemTitle: item.title,
          chunk: { text: item.content.slice(0, remaining), page: 0, index: 0, startChar: 0, endChar: remaining },
        });
        break;
      }

      sections.push(section);
      selected.push(entry);
      injectedChunks.push({
        libraryItemId: item.id,
        libraryId: item.libraryId,
        itemTitle: item.title,
        chunk: { text: item.content, page: 0, index: 0, startChar: 0, endChar: item.content.length },
      });
      usedChars += section.length;
    }

    if (usedChars >= maxChars) break;
  }

  return {
    contextText: sections.join("\n\n"),
    usedItems: selected,
    injectedChunks,
  };
}
