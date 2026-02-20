import type { ScoredLibraryItem } from "@/services/storage";

export const DEFAULT_CONTEXT_TOKEN_BUDGET = 2200;

export function estimateTokenCountFromChars(chars: number): number {
  return Math.ceil(chars / 4);
}

export function estimateCharBudgetFromTokens(tokens: number): number {
  return Math.max(tokens * 4, 0);
}

export function buildContextSnippet(
  items: ScoredLibraryItem[],
  maxTokens = DEFAULT_CONTEXT_TOKEN_BUDGET
): { contextText: string; usedItems: ScoredLibraryItem[] } {
  const maxChars = estimateCharBudgetFromTokens(maxTokens);
  const selected: ScoredLibraryItem[] = [];
  const sections: string[] = [];
  let usedChars = 0;

  for (const entry of items) {
    const { item } = entry;
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
      break;
    }

    sections.push(section);
    selected.push(entry);
    usedChars += section.length;
  }

  return {
    contextText: sections.join("\n\n"),
    usedItems: selected,
  };
}
