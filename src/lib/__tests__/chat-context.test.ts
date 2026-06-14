import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing the module under test
vi.mock("@/services/storage", () => ({
  StorageService: {
    searchLibraryItems: vi.fn().mockResolvedValue([]),
    getDashboardStats: vi.fn().mockResolvedValue({
      dueToday: 5,
      reviewedToday: 3,
      totalCards: 100,
      masteredCards: 40,
      streak: 7,
    }),
    getDashboardInsights: vi.fn().mockResolvedValue({
      reviewedLast7Days: 20,
      reviewedPrev7Days: 15,
      bestStreak: 14,
      dueByLibrary: [{ name: "Math", dueCount: 3 }],
      upcomingReviews: [{ label: "Tomorrow", dueCount: 5 }],
    }),
  },
}));

vi.mock("@/services/ai/openui", () => ({
  openuiLibrary: {
    prompt: vi.fn().mockReturnValue("openui-prompt"),
  },
  openuiPromptOptions: {},
}));

vi.mock("@/lib/constants", () => ({
  SYSTEM_PROMPT: "SYSTEM",
}));

vi.mock("@/services/ai/prompts/exercise.prompts", () => ({
  buildExercisePrompt: vi.fn().mockReturnValue("exercise-prompt"),
}));

import { buildChatContext } from "@/lib/chat-context";
import { StorageService } from "@/services/storage";

const mockSearch = StorageService.searchLibraryItems as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSearch.mockResolvedValue([]);
  (StorageService.getDashboardStats as ReturnType<typeof vi.fn>).mockResolvedValue({
    dueToday: 5,
    reviewedToday: 3,
    totalCards: 100,
    masteredCards: 40,
    streak: 7,
  });
  (StorageService.getDashboardInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
    reviewedLast7Days: 20,
    reviewedPrev7Days: 15,
    bestStreak: 14,
    dueByLibrary: [{ name: "Math", dueCount: 3 }],
    upcomingReviews: [{ label: "Tomorrow", dueCount: 5 }],
  });
});

describe("buildChatContext", () => {
  it("returns system + user messages with no libraries", async () => {
    const { aiMessages, injectedChunks } = await buildChatContext(
      "hello",
      [],
      [],
      null
    );

    expect(mockSearch).not.toHaveBeenCalled();
    expect(injectedChunks).toEqual([]);
    expect(aiMessages[0].role).toBe("system");
    expect(aiMessages[0].content).toContain("SYSTEM");
    expect(aiMessages[aiMessages.length - 1]).toEqual({
      role: "user",
      content: "hello",
    });
  });

  it("searches library items when libraryIds provided", async () => {
    await buildChatContext("hello", ["lib-1", "lib-2"], [], null);

    expect(mockSearch).toHaveBeenCalledWith({
      query: "hello",
      libraryIds: ["lib-1", "lib-2"],
      limit: 24,
    });
  });

  it("includes stats in system message for normal chat", async () => {
    const { aiMessages } = await buildChatContext("hello", [], [], null);

    expect(aiMessages[0].content).toContain("Cards due today: 5");
    expect(aiMessages[0].content).toContain("Due by library: Math: 3");
    expect(aiMessages[0].content).toContain("Upcoming reviews: Tomorrow: 5");
  });

  it("skips stats and injects exercise prompt when exerciseIntent provided", async () => {
    const { aiMessages } = await buildChatContext("hello", [], [], {
      type: "flashcard",
      topic: "mitosis",
    });

    expect(StorageService.getDashboardStats).not.toHaveBeenCalled();
    expect(StorageService.getDashboardInsights).not.toHaveBeenCalled();
    expect(aiMessages[0].content).toContain("exercise-prompt");
    expect(aiMessages[0].content).not.toContain("Cards due today");
  });

  it("includes history messages capped at 20", async () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg-${i}`,
    }));

    const { aiMessages } = await buildChatContext("hello", [], history, null);

    // system + last 20 history + user = 22
    expect(aiMessages).toHaveLength(22);
    // Last 20 of 25-item array = indices 5..24
    expect(aiMessages[1].content).toBe("msg-5");
    expect(aiMessages[20].content).toBe("msg-24");
  });

  it("degrades gracefully when stats fetch fails", async () => {
    (StorageService.getDashboardStats as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error")
    );

    const { aiMessages } = await buildChatContext("hello", [], [], null);

    // Stats section absent but message still formed
    expect(aiMessages[0].role).toBe("system");
    expect(aiMessages[0].content).toContain("SYSTEM");
    expect(aiMessages[0].content).not.toContain("Cards due today");
  });
});
