import { describe, it, expect } from "vitest";
import { parseSearchQuery, matchesParsedQuery } from "./search-query";

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
