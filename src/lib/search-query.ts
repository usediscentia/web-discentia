export interface ParsedSearchQuery {
  /** Quoted segments — must match as exact (case-insensitive) substrings */
  phrases: string[];
  /** Remaining whitespace-separated words */
  tokens: string[];
}

/**
 * Parses a search query into quoted phrases and loose tokens.
 * `"spaced repetition" sm2` → phrases=["spaced repetition"], tokens=["sm2"].
 * An unbalanced quote is ignored and its content treated as tokens.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const query = raw.trim().toLowerCase();
  if (!query) return { phrases: [], tokens: [] };

  const phrases: string[] = [];
  const remainder = query.replace(/"([^"]*)"/g, (_, phrase: string) => {
    const trimmed = phrase.trim();
    if (trimmed) phrases.push(trimmed);
    return " ";
  });

  const tokens = remainder
    .replace(/"/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return { phrases, tokens };
}

/** True when every phrase and every token appears in the text (case-insensitive). */
export function matchesParsedQuery(
  text: string,
  parsed: ParsedSearchQuery
): boolean {
  const haystack = text.toLowerCase();
  return (
    parsed.phrases.every((phrase) => haystack.includes(phrase)) &&
    parsed.tokens.every((token) => haystack.includes(token))
  );
}

/**
 * Filters decks by name against a raw query (quoted phrases + tokens).
 * Empty query returns no decks — the palette shows recents instead.
 */
export function filterDecksByQuery<T extends { name: string }>(
  decks: T[],
  raw: string
): T[] {
  const parsed = parseSearchQuery(raw);
  if (parsed.phrases.length === 0 && parsed.tokens.length === 0) return [];
  return decks.filter((deck) => matchesParsedQuery(deck.name, parsed));
}
