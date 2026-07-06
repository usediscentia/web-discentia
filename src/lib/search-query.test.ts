import { describe, it, expect } from "vitest";
import {
  parseSearchQuery,
  matchesParsedQuery,
  filterDecksByQuery,
} from "./search-query";

describe("parseSearchQuery", () => {
  it("splits an unquoted query into tokens", () => {
    expect(parseSearchQuery("spaced repetition sm2")).toEqual({
      phrases: [],
      tokens: ["spaced", "repetition", "sm2"],
    });
  });

  it("extracts quoted phrases and keeps remaining tokens", () => {
    expect(parseSearchQuery('"spaced repetition" sm2')).toEqual({
      phrases: ["spaced repetition"],
      tokens: ["sm2"],
    });
  });

  it("supports multiple phrases", () => {
    expect(parseSearchQuery('"ease factor" "review date"')).toEqual({
      phrases: ["ease factor", "review date"],
      tokens: [],
    });
  });

  it("treats an unbalanced quote as plain tokens", () => {
    expect(parseSearchQuery('"spaced repetition')).toEqual({
      phrases: [],
      tokens: ["spaced", "repetition"],
    });
  });

  it("drops empty phrases", () => {
    expect(parseSearchQuery('"" sm2')).toEqual({
      phrases: [],
      tokens: ["sm2"],
    });
  });

  it("returns empty result for empty or whitespace query", () => {
    expect(parseSearchQuery("")).toEqual({ phrases: [], tokens: [] });
    expect(parseSearchQuery("   ")).toEqual({ phrases: [], tokens: [] });
  });

  it("lowercases phrases and tokens", () => {
    expect(parseSearchQuery('"Spaced Repetition" SM2')).toEqual({
      phrases: ["spaced repetition"],
      tokens: ["sm2"],
    });
  });
});

describe("matchesParsedQuery", () => {
  it("matches when all phrases and tokens are present", () => {
    const parsed = parseSearchQuery('"spaced repetition" sm2');
    expect(
      matchesParsedQuery("Spaced repetition uses the SM2 algorithm", parsed)
    ).toBe(true);
  });

  it("rejects when a phrase is broken up", () => {
    const parsed = parseSearchQuery('"spaced repetition"');
    expect(matchesParsedQuery("repetition that is spaced out", parsed)).toBe(
      false
    );
  });

  it("rejects when a token is missing", () => {
    const parsed = parseSearchQuery("spaced sm2");
    expect(matchesParsedQuery("spaced repetition", parsed)).toBe(false);
  });

  it("is case-insensitive on the text", () => {
    const parsed = parseSearchQuery("sm2");
    expect(matchesParsedQuery("The SM2 Algorithm", parsed)).toBe(true);
  });

  it("matches everything when the query is empty", () => {
    expect(matchesParsedQuery("anything", parseSearchQuery(""))).toBe(true);
  });
});

describe("filterDecksByQuery", () => {
  const decks = [
    { name: "Biologia Celular" },
    { name: "História do Brasil" },
    { name: "Cell Biology Basics" },
  ];

  it("matches deck names by token, case-insensitive", () => {
    expect(filterDecksByQuery(decks, "biologia")).toEqual([
      { name: "Biologia Celular" },
    ]);
  });

  it("requires all tokens to be present", () => {
    expect(filterDecksByQuery(decks, "biology basics")).toEqual([
      { name: "Cell Biology Basics" },
    ]);
    expect(filterDecksByQuery(decks, "biology brasil")).toEqual([]);
  });

  it("supports quoted exact phrases", () => {
    expect(filterDecksByQuery(decks, '"cell biology"')).toEqual([
      { name: "Cell Biology Basics" },
    ]);
    expect(filterDecksByQuery(decks, '"biology cell"')).toEqual([]);
  });

  it("returns no decks for an empty query", () => {
    expect(filterDecksByQuery(decks, "")).toEqual([]);
    expect(filterDecksByQuery(decks, "   ")).toEqual([]);
  });
});
