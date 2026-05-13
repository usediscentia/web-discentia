import { describe, it, expect } from "vitest";
import {
  stripCitationsBlock,
  extractCitationsFromChunks,
  splitMessageAndCitations,
} from "./citations";
import type { InjectedChunk } from "@/lib/tokens";

function makeChunk(
  libraryItemId: string,
  text: string,
  overrides: Partial<InjectedChunk> = {}
): InjectedChunk {
  return {
    libraryItemId,
    libraryId: "lib-1",
    itemTitle: "Test Item",
    chunk: { text, page: 0, index: 0, startChar: 0, endChar: text.length },
    ...overrides,
  };
}

describe("stripCitationsBlock", () => {
  it("removes <CITATIONS>...</CITATIONS> block", () => {
    const input = "Hello world\n<CITATIONS>[]\n</CITATIONS>";
    expect(stripCitationsBlock(input)).toBe("Hello world");
  });

  it("removes block with [/CITATIONS] closing tag", () => {
    const input = "Text<CITATIONS>data[/CITATIONS]";
    expect(stripCitationsBlock(input)).toBe("Text");
  });

  it("returns trimmed text when no block present", () => {
    expect(stripCitationsBlock("  plain text  ")).toBe("plain text");
  });
});

describe("extractCitationsFromChunks", () => {
  it("returns [] when no chunks", () => {
    expect(extractCitationsFromChunks("some text", [])).toEqual([]);
  });

  it("returns citation when word overlap exceeds threshold", () => {
    const chunk = makeChunk(
      "item-1",
      "photosynthesis converts sunlight water carbon dioxide glucose"
    );
    const result = extractCitationsFromChunks(
      "photosynthesis converts sunlight water carbon dioxide into glucose",
      [chunk]
    );
    expect(result).toHaveLength(1);
    expect(result[0].libraryItemId).toBe("item-1");
  });

  it("filters out chunks below 10% word overlap", () => {
    const chunk = makeChunk(
      "item-1",
      "completely unrelated content about medieval castles and knights"
    );
    const result = extractCitationsFromChunks(
      "photosynthesis converts sunlight",
      [chunk]
    );
    expect(result).toEqual([]);
  });

  it("keeps best-scoring chunk per libraryItemId", () => {
    const weak = makeChunk("item-1", "photosynthesis happens plants");
    const strong = makeChunk(
      "item-1",
      "photosynthesis converts sunlight water carbon dioxide glucose oxygen"
    );
    const result = extractCitationsFromChunks(
      "photosynthesis converts sunlight water carbon dioxide into glucose oxygen production",
      [weak, strong]
    );
    expect(result).toHaveLength(1);
    // excerpt from strong chunk (longer text, better match)
    expect(result[0].excerpt).toContain("photosynthesis converts");
  });

  it("returns at most 3 citations", () => {
    const text = "alpha bravo charlie delta echo foxtrot gamma hotel india juliet";
    const chunks = ["A", "B", "C", "D"].map((id, i) =>
      makeChunk(`item-${id}`, `alpha bravo charlie delta echo foxtrot gamma hotel india juliet item${i}`)
    );
    const result = extractCitationsFromChunks(text, chunks);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("includes page number when chunk.page > 0", () => {
    const chunk = makeChunk(
      "item-1",
      "photosynthesis converts sunlight water carbon dioxide glucose",
      { chunk: { text: "photosynthesis converts sunlight water carbon dioxide glucose", page: 5, index: 0, startChar: 0, endChar: 60 } }
    );
    const result = extractCitationsFromChunks(
      "photosynthesis converts sunlight water carbon dioxide glucose",
      [chunk]
    );
    expect(result[0].page).toBe(5);
  });
});

describe("splitMessageAndCitations", () => {
  const allowed = new Set(["item-1"]);

  it("returns clean content and empty citations when no block", () => {
    const { cleanContent, citations } = splitMessageAndCitations("Hello", allowed);
    expect(cleanContent).toBe("Hello");
    expect(citations).toEqual([]);
  });

  it("parses valid JSON citations block", () => {
    const msg = `Answer text\n<CITATIONS>[{"libraryItemId":"item-1","libraryId":"lib-1","itemTitle":"Doc","excerpt":"Some text"}]</CITATIONS>`;
    const { cleanContent, citations } = splitMessageAndCitations(msg, allowed);
    expect(cleanContent).toBe("Answer text");
    expect(citations).toHaveLength(1);
    expect(citations[0].libraryItemId).toBe("item-1");
  });

  it("filters citations with itemId not in allowedItemIds", () => {
    const msg = `Text\n<CITATIONS>[{"libraryItemId":"item-999","libraryId":"lib-1","itemTitle":"Other","excerpt":"x"}]</CITATIONS>`;
    const { citations } = splitMessageAndCitations(msg, allowed);
    expect(citations).toEqual([]);
  });

  it("returns empty citations on invalid JSON", () => {
    const msg = `Text\n<CITATIONS>not-json</CITATIONS>`;
    const { cleanContent, citations } = splitMessageAndCitations(msg, allowed);
    expect(cleanContent).toBe("Text");
    expect(citations).toEqual([]);
  });

  it("strips partial/unclosed CITATIONS block from display text", () => {
    const msg = "Text<CITATIONS>orphan block";
    const { cleanContent } = splitMessageAndCitations(msg, allowed);
    expect(cleanContent).not.toContain("<CITATIONS>");
  });
});
