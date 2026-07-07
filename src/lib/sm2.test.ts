import { describe, it, expect, beforeEach } from "vitest";
import { sm2 } from "./sm2";
import type { SRSCard } from "@/types/srs";

const base: SRSCard = {
  id: "card-1",
  front: "Q",
  back: "A",
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  nextReviewDate: 0,
  lastReviewDate: null,
  lapses: 0,
  createdAt: 0,
};

describe("sm2", () => {
  describe("hard rating (q=2)", () => {
    it("resets repetitions to 0", () => {
      const card = { ...base, repetitions: 3 };
      expect(sm2(card, "hard").repetitions).toBe(0);
    });

    it("increments lapses", () => {
      const card = { ...base, lapses: 2 };
      expect(sm2(card, "hard").lapses).toBe(3);
    });

    it("sets interval to 1", () => {
      const card = { ...base, interval: 20 };
      expect(sm2(card, "hard").interval).toBe(1);
    });

    it("schedules next review in 1 day", () => {
      const result = sm2(base, "hard");
      expect(result.nextReviewDate - result.lastReviewDate).toBe(86400000);
    });
  });

  describe("good rating (q=4) — first repetition", () => {
    it("interval is 1", () => {
      expect(sm2(base, "good").interval).toBe(1);
    });

    it("repetitions increments to 1", () => {
      expect(sm2(base, "good").repetitions).toBe(1);
    });

    it("lapses unchanged", () => {
      expect(sm2(base, "good").lapses).toBe(0);
    });
  });

  describe("easy rating (q=5) — first repetition", () => {
    it("interval is 4", () => {
      expect(sm2(base, "easy").interval).toBe(4);
    });

    it("repetitions increments to 1", () => {
      expect(sm2(base, "easy").repetitions).toBe(1);
    });
  });

  describe("second repetition (repetitions=1)", () => {
    it("interval is always 6", () => {
      const card = { ...base, repetitions: 1, interval: 1 };
      expect(sm2(card, "good").interval).toBe(6);
      expect(sm2(card, "easy").interval).toBe(6);
    });
  });

  describe("subsequent repetitions (repetitions >= 2)", () => {
    it("interval = round(prev * easeFactor)", () => {
      const card = { ...base, repetitions: 2, interval: 6, easeFactor: 2.5 };
      const result = sm2(card, "good");
      // q=4: newEase = 2.5 + 0.1 - 1*(0.08 + 1*0.02) = 2.5
      expect(result.interval).toBe(Math.round(6 * 2.5));
    });

    it("easeFactor floor is 1.3", () => {
      const card = { ...base, repetitions: 5, interval: 10, easeFactor: 1.3 };
      // good: q=4 → delta = 0.1 - 0.1 = 0, ease stays 1.3 → clamped to 1.3
      expect(sm2(card, "good").easeFactor).toBeCloseTo(1.3);
      // even if algo would go below, it's floored
      const card2 = { ...base, repetitions: 5, interval: 10, easeFactor: 1.31 };
      expect(sm2(card2, "good").easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("timestamps", () => {
    it("nextReviewDate = lastReviewDate + interval * 86400000", () => {
      const result = sm2(base, "easy"); // interval=4
      expect(result.nextReviewDate - result.lastReviewDate).toBe(4 * 86400000);
    });
  });
});
