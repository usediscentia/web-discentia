import type { ContentChunk } from "@/types/library";

type PdfTextItem = { str?: string; transform?: number[] };

const MIN_CHUNK_CHARS = 80;
const MAX_CHUNK_CHARS = 2000;
const HEADING_MAX_CHARS = 200;
const HEADING_FONT_RATIO = 1.2; // font size > median * this ratio → heading candidate
const HEADER_FOOTER_PAGE_THRESHOLD = 0.5; // text on >50% of pages at same Y = header/footer

interface RawBlock {
  text: string;
  fontSize: number;
  isHeading: boolean;
}

// --- Header/footer detection (cross-page) ---

/**
 * Detects repeated text that appears on most pages (headers/footers).
 * Returns a Set of text strings to exclude from chunks.
 */
export function detectHeaderFooterTexts(
  allPageItems: Array<{ pageNum: number; items: PdfTextItem[] }>
): Set<string> {
  if (allPageItems.length < 3) return new Set();

  // Collect (text, normalizedY) per page — normalizedY is Y relative to page max-Y
  const pageCount = allPageItems.length;
  const textPageCounts = new Map<string, number>();

  for (const { items } of allPageItems) {
    if (items.length === 0) continue;

    // Get Y range for the page
    const ys = items
      .filter((it) => Array.isArray(it.transform) && it.transform.length >= 6)
      .map((it) => it.transform![5]);
    if (ys.length === 0) continue;
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    const pageHeight = maxY - minY || 1;

    // Group items by Y bucket (top 10% or bottom 10% of page)
    const seenThisPage = new Set<string>();
    for (const item of items) {
      const text = (item.str || "").trim();
      if (!text || text.length < 2 || text.length > 80) continue;
      if (!Array.isArray(item.transform) || item.transform.length < 6) continue;

      const normalizedY = (item.transform[5] - minY) / pageHeight;
      // Only consider items in top 10% or bottom 10% of page
      if (normalizedY > 0.1 && normalizedY < 0.9) continue;

      const key = text.toLowerCase().replace(/\s+/g, " ");
      if (!seenThisPage.has(key)) {
        seenThisPage.add(key);
        textPageCounts.set(key, (textPageCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const excluded = new Set<string>();
  for (const [text, count] of textPageCounts) {
    if (count / pageCount > HEADER_FOOTER_PAGE_THRESHOLD) {
      excluded.add(text);
    }
  }
  return excluded;
}

// --- Per-page chunking ---

/**
 * Chunks a single PDF page into semantic ContentChunk objects.
 * Pure function — no side effects.
 */
export function chunkPageItems(
  pageNum: number,
  items: PdfTextItem[],
  charOffset: number,
  options: {
    headerFooterTexts?: Set<string>;
    prevHeading?: string;
    prevLastSentence?: string;
  } = {}
): {
  chunks: ContentChunk[];
  pageText: string;
  lastHeading: string;
  lastSentence: string;
} {
  const { headerFooterTexts = new Set(), prevHeading = "", prevLastSentence = "" } = options;

  // --- Pass 1: Extract raw blocks with font metadata ---
  const hasTransform =
    items.length > 0 && Array.isArray(items[0]?.transform) && items[0].transform!.length >= 6;

  const rawBlocks: Array<{ text: string; fontSize: number }> = [];

  if (hasTransform) {
    const groups: Array<{ texts: string[]; fontSize: number }> = [];
    let currentGroup: string[] = [];
    let currentFontSize = 12;
    let prevY: number | null = null;
    let prevFontHeight = 12;

    for (const item of items) {
      const text = item.str || "";
      if (!text.trim()) continue;

      const transform = item.transform!;
      const y = transform[5];
      const scaleY = Math.abs(transform[3]) || prevFontHeight;

      if (prevY !== null) {
        const gap = Math.abs(prevY - y);
        if (gap > scaleY * 1.5) {
          if (currentGroup.length > 0) {
            groups.push({ texts: currentGroup, fontSize: currentFontSize });
            currentGroup = [];
          }
        }
      }

      currentGroup.push(text);
      currentFontSize = scaleY;
      prevY = y;
      prevFontHeight = scaleY;
    }
    if (currentGroup.length > 0) {
      groups.push({ texts: currentGroup, fontSize: currentFontSize });
    }

    for (const g of groups) {
      const text = g.texts.join(" ").trim();
      if (text) rawBlocks.push({ text, fontSize: g.fontSize });
    }
  } else {
    // Fallback: split by double newlines
    const fullText = items.map((i) => i.str || "").join(" ").trim();
    const paras = fullText.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
    for (const p of paras) rawBlocks.push({ text: p, fontSize: 12 });
  }

  // --- Pass 2: Detect headings by font size ---
  const fontSizes = rawBlocks.map((b) => b.fontSize).filter((f) => f > 0);
  const median = fontSizes.length > 0 ? getMedian(fontSizes) : 12;

  const blocksWithHeading: RawBlock[] = rawBlocks.map((b) => ({
    text: b.text,
    fontSize: b.fontSize,
    isHeading:
      b.fontSize > median * HEADING_FONT_RATIO &&
      b.text.length <= HEADING_MAX_CHARS &&
      b.text.trim().length > 0,
  }));

  // --- Pass 3: Filter header/footer texts ---
  const filtered = blocksWithHeading.filter((b) => {
    const key = b.text.toLowerCase().replace(/\s+/g, " ");
    return !headerFooterTexts.has(key);
  });

  // --- Pass 4: Merge short blocks, split oversized ---
  // Separate heading blocks from body blocks for processing
  const processedBlocks: Array<{ text: string; isHeading: boolean }> = [];

  // Merge non-heading body paragraphs
  const bodyBlocks = filtered.filter((b) => !b.isHeading);
  const headingBlocks = filtered.filter((b) => b.isHeading);

  // Interleaved processing: preserve heading positions relative to body
  const bodyMerged: string[] = [];
  {
    let pending = "";
    for (const b of bodyBlocks.map((b) => b.text)) {
      if (pending) {
        pending = pending + " " + b;
        if (pending.length >= MIN_CHUNK_CHARS) {
          bodyMerged.push(pending);
          pending = "";
        }
      } else if (b.length < MIN_CHUNK_CHARS) {
        pending = b;
      } else {
        bodyMerged.push(b);
      }
    }
    if (pending) bodyMerged.push(pending);
  }

  // Split oversized body blocks
  const bodySplit: string[] = [];
  for (const para of bodyMerged) {
    if (para.length <= MAX_CHUNK_CHARS) {
      bodySplit.push(para);
      continue;
    }
    const parts = splitAtSentenceBoundaries(para, MAX_CHUNK_CHARS);
    bodySplit.push(...parts);
  }

  // Rebuild interleaved list preserving heading order
  // Strategy: headings come first on the page, then body in order
  for (const b of headingBlocks) {
    processedBlocks.push({ text: b.text, isHeading: true });
  }
  for (const text of bodySplit) {
    processedBlocks.push({ text, isHeading: false });
  }

  // --- Pass 5: Assign headings and build overlap ---
  let currentHeading = prevHeading;
  const finalChunks: Array<{ text: string; heading: string }> = [];

  for (const block of processedBlocks) {
    if (block.isHeading) {
      currentHeading = block.text;
      // Headings are not stored as separate chunks — they label the following body chunks
      continue;
    }

    // Add overlap from previous chunk's last sentence
    let text = block.text;
    if (prevLastSentence && finalChunks.length === 0) {
      // Only add overlap to the first body chunk of the page (carries from prev page)
      text = prevLastSentence + " " + text;
    } else if (finalChunks.length > 0) {
      const prev = finalChunks[finalChunks.length - 1];
      const lastSentence = extractLastSentence(prev.text);
      if (lastSentence && lastSentence !== prev.text) {
        text = lastSentence + " " + text;
      }
    }

    finalChunks.push({ text, heading: currentHeading });
  }

  // Build ContentChunk array
  const pageText = finalChunks.map((c) => c.text).join("\n\n");
  const chunks: ContentChunk[] = finalChunks.map((c, index) => {
    const startChar = charOffset + pageText.indexOf(c.text);
    return {
      text: c.text,
      page: pageNum,
      index,
      startChar,
      endChar: startChar + c.text.length,
      heading: c.heading || undefined,
    };
  });

  const lastHeading = currentHeading;
  const lastSentence =
    finalChunks.length > 0
      ? extractLastSentence(finalChunks[finalChunks.length - 1].text)
      : "";

  return { chunks, pageText, lastHeading, lastSentence };
}

// --- Helpers ---

function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function splitAtSentenceBoundaries(text: string, maxChars: number): string[] {
  // Supports . ! ? as sentence endings, and bullet/numbered list items
  const breakPoints: number[] = [];
  const pattern = /(?<=[.!?;])\s+(?=[A-Z\d\u2022\-•])|(?:\n)\s*(?=[•\-\d]+[.)]\s)/g;
  for (const match of text.matchAll(pattern)) {
    breakPoints.push(match.index! + match[0].length - match[0].trimStart().length);
  }

  const parts: string[] = [];
  let start = 0;
  for (const bp of breakPoints) {
    if (bp - start >= maxChars) {
      parts.push(text.slice(start, bp).trim());
      start = bp;
    }
  }
  if (start < text.length) parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

function extractLastSentence(text: string): string {
  // Find the last sentence boundary
  const match = text.match(/[.!?][^.!?]*$/);
  if (!match || match.index === undefined) return "";
  const sentence = text.slice(match.index + 1).trim();
  // Only return if it's a meaningful sentence (>20 chars and not the whole text)
  if (sentence.length < 20 || sentence === text) return "";
  return sentence;
}
