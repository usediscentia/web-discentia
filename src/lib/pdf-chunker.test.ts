import { describe, it, expect } from "vitest";
import { detectHeaderFooterTexts, chunkPageItems } from "./pdf-chunker";

// Helper to build a minimal PdfTextItem with transform
function item(str: string, y: number, fontSize = 12) {
  return { str, transform: [1, 0, 0, fontSize, 0, y] };
}

describe("detectHeaderFooterTexts", () => {
  it("returns empty set for fewer than 3 pages", () => {
    const pages = [
      { pageNum: 1, items: [item("Page 1", 10)] },
      { pageNum: 2, items: [item("Page 2", 10)] },
    ];
    expect(detectHeaderFooterTexts(pages).size).toBe(0);
  });

  it("detects text repeated on >50% of pages in header/footer zone", () => {
    // Y positions near top or bottom of page (outside 10%–90% band)
    // Page height = maxY - minY. Put content at y=500 (body) and header at y=990 (top)
    const makePage = (num: number) => ({
      pageNum: num,
      items: [
        item("Chapter Title", 990, 12), // top 10% → header candidate
        item("Body content that is long enough", 500, 12),
      ],
    });
    const pages = [1, 2, 3, 4].map(makePage);
    const result = detectHeaderFooterTexts(pages);
    expect(result.has("chapter title")).toBe(true);
  });

  it("does not flag text appearing on minority of pages", () => {
    const pages = [
      { pageNum: 1, items: [item("Unique header", 990)] },
      { pageNum: 2, items: [item("Other text", 990)] },
      { pageNum: 3, items: [item("Different", 990)] },
      { pageNum: 4, items: [item("Also different", 990)] },
    ];
    const result = detectHeaderFooterTexts(pages);
    expect(result.has("unique header")).toBe(false);
  });
});

describe("chunkPageItems", () => {
  it("falls back to paragraph split when items have no transform", () => {
    const items = [{ str: "First paragraph.\n\nSecond paragraph with more words here." }];
    const { chunks } = chunkPageItems(1, items, 0);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.every((c) => c.page === 1)).toBe(true);
  });

  it("merges short blocks below MIN_CHUNK_CHARS (80)", () => {
    // Two short items far apart in Y → two raw blocks, both < 80 chars → merged
    const items = [
      item("Short text.", 200),
      item("Also short.", 100), // gap triggers new raw block
    ];
    const { chunks } = chunkPageItems(1, items, 0);
    // Should merge into 1 chunk since both are short
    expect(chunks.length).toBe(1);
  });

  it("assigns page number correctly", () => {
    const items = [
      item("Some reasonable length body text that exceeds the minimum chunk character count.", 200),
    ];
    const { chunks } = chunkPageItems(3, items, 0);
    for (const c of chunks) {
      expect(c.page).toBe(3);
    }
  });

  it("detects heading by font size and labels following chunk", () => {
    // Font size 24 vs body 12 — ratio 2.0 > HEADING_FONT_RATIO 1.2
    const items = [
      { str: "Big Heading", transform: [1, 0, 0, 24, 0, 300] },
      item("Body content that follows the heading and has enough characters to form a chunk.", 200),
    ];
    const { chunks, lastHeading } = chunkPageItems(1, items, 0);
    expect(lastHeading).toBe("Big Heading");
    // heading labels the body chunk
    if (chunks.length > 0) {
      expect(chunks[0].heading).toBe("Big Heading");
    }
  });

  it("carries heading from previous page via prevHeading option", () => {
    const items = [
      item("Body text that has enough characters to form a standalone chunk here.", 200),
    ];
    const { chunks } = chunkPageItems(2, items, 0, { prevHeading: "Inherited Heading" });
    expect(chunks[0].heading).toBe("Inherited Heading");
  });

  it("filters out header/footer texts", () => {
    const excluded = new Set(["page number"]);
    const items = [
      item("Page Number", 990), // will be in header zone AND in excluded set
      item("Real content that is long enough to form a valid body chunk here.", 500),
    ];
    const { chunks } = chunkPageItems(1, items, 0, { headerFooterTexts: excluded });
    for (const c of chunks) {
      expect(c.text.toLowerCase()).not.toContain("page number");
    }
  });
});
