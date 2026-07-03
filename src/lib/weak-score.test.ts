import { describe, it, expect } from "vitest";
import { computeWeakScore } from "./weak-score";

describe("computeWeakScore", () => {
  it("returns 0 for no cards", () => {
    expect(computeWeakScore([], 0)).toBe(0);
  });

  it("returns 0 for fresh cards at default ease with no lapses", () => {
    expect(computeWeakScore([2.5, 2.5], 0)).toBe(0);
  });

  it("returns 1 at minimum ease with saturated lapses", () => {
    // avgEase 1.3 → easeScore 1; 10 lapses/card → lapseScore 1
    expect(computeWeakScore([1.3, 1.3], 20)).toBe(1);
  });

  it("weighs ease 0.7 and lapses 0.3", () => {
    // avgEase 1.3 → easeScore 1, no lapses → 0.7
    expect(computeWeakScore([1.3], 0)).toBeCloseTo(0.7);
    // default ease, 10 lapses on 1 card → lapseScore 1 → 0.3
    expect(computeWeakScore([2.5], 10)).toBeCloseTo(0.3);
  });

  it("clamps ease above default to 0", () => {
    expect(computeWeakScore([3.0, 3.0], 0)).toBe(0);
  });

  it("caps lapse score at 1", () => {
    expect(computeWeakScore([2.5], 100)).toBeCloseTo(0.3);
  });

  it("matches the getWeakSpots formula for a mixed group", () => {
    // avgEase 1.9 → easeScore (2.5-1.9)/1.2 = 0.5; 4 lapses / 2 cards = 2 → 0.2
    expect(computeWeakScore([1.8, 2.0], 4)).toBeCloseTo(0.5 * 0.7 + 0.2 * 0.3);
  });
});
