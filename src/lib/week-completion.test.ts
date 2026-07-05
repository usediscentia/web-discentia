import { describe, it, expect } from "vitest";
import { getWeekCompletion } from "./week-completion";

// 2026-06-29 is a Monday; 2026-07-05 is a Sunday.
describe("getWeekCompletion", () => {
  it("returns 7 booleans, Monday-first", () => {
    const result = getWeekCompletion({}, new Date(2026, 6, 1)); // Wed Jul 1
    expect(result).toHaveLength(7);
    expect(result.every((v) => v === false)).toBe(true);
  });

  it("fills days with activity in the current week", () => {
    const activity = {
      "2026-06-29": 3, // Mon
      "2026-07-01": 1, // Wed
    };
    const result = getWeekCompletion(activity, new Date(2026, 6, 1)); // Wed Jul 1
    expect(result).toEqual([true, false, true, false, false, false, false]);
  });

  it("today = Monday: week starts today", () => {
    const activity = { "2026-06-29": 1 };
    const result = getWeekCompletion(activity, new Date(2026, 5, 29)); // Mon Jun 29
    expect(result).toEqual([true, false, false, false, false, false, false]);
  });

  it("today = Sunday: week started previous Monday", () => {
    const activity = {
      "2026-06-29": 2, // Mon
      "2026-07-05": 1, // Sun (today)
    };
    const result = getWeekCompletion(activity, new Date(2026, 6, 5)); // Sun Jul 5
    expect(result).toEqual([true, false, false, false, false, false, true]);
  });

  it("ignores activity outside the current week", () => {
    const activity = {
      "2026-06-28": 5, // Sunday of previous week
      "2026-07-06": 2, // Monday of next week
    };
    const result = getWeekCompletion(activity, new Date(2026, 6, 1)); // Wed Jul 1
    expect(result).toEqual([false, false, false, false, false, false, false]);
  });

  it("treats a zero count as not completed", () => {
    const activity = { "2026-07-01": 0 };
    const result = getWeekCompletion(activity, new Date(2026, 6, 1));
    expect(result[2]).toBe(false);
  });

  it("uses single-digit month/day padding matching toDayKey", () => {
    // 2026-03-02 is a Monday → keys like "2026-03-02"
    const activity = { "2026-03-04": 1 }; // Wed
    const result = getWeekCompletion(activity, new Date(2026, 2, 4));
    expect(result).toEqual([false, false, true, false, false, false, false]);
  });
});
