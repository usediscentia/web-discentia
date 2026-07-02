import { describe, it, expect } from "vitest";
import {
  planDeckMigration,
  INBOX_DECK_ID,
  INBOX_DECK_NAME,
} from "./deck-migration";

const NOW = 1_700_000_000_000;

function idGen() {
  let n = 0;
  return () => `deck-${++n}`;
}

describe("planDeckMigration", () => {
  it("groups cards by libraryItemId into one deck per item", () => {
    const plan = planDeckMigration(
      [
        { id: "c1", libraryItemId: "item-a" },
        { id: "c2", libraryItemId: "item-a" },
        { id: "c3", libraryItemId: "item-b" },
      ],
      new Map([
        ["item-a", "Anatomy"],
        ["item-b", "Physics"],
      ]),
      NOW,
      idGen()
    );

    expect(plan.decks).toHaveLength(2);
    expect(plan.decks.map((d) => d.name)).toEqual(["Anatomy", "Physics"]);
    expect(plan.assignments["c1"]).toBe(plan.assignments["c2"]);
    expect(plan.assignments["c3"]).not.toBe(plan.assignments["c1"]);
  });

  it("sends orphan cards to a single Inbox deck", () => {
    const plan = planDeckMigration(
      [
        { id: "c1" },
        { id: "c2", libraryItemId: "item-a" },
        { id: "c3" },
      ],
      new Map([["item-a", "Anatomy"]]),
      NOW,
      idGen()
    );

    expect(plan.decks).toHaveLength(2);
    const inbox = plan.decks.find((d) => d.id === INBOX_DECK_ID);
    expect(inbox?.name).toBe(INBOX_DECK_NAME);
    expect(plan.assignments["c1"]).toBe(INBOX_DECK_ID);
    expect(plan.assignments["c3"]).toBe(INBOX_DECK_ID);
    expect(plan.assignments["c2"]).not.toBe(INBOX_DECK_ID);
  });

  it("does not create Inbox when there are no orphans", () => {
    const plan = planDeckMigration(
      [{ id: "c1", libraryItemId: "item-a" }],
      new Map([["item-a", "Anatomy"]]),
      NOW,
      idGen()
    );

    expect(plan.decks.find((d) => d.id === INBOX_DECK_ID)).toBeUndefined();
  });

  it("falls back to 'Untitled deck' when the library item is gone", () => {
    const plan = planDeckMigration(
      [{ id: "c1", libraryItemId: "deleted-item" }],
      new Map(),
      NOW,
      idGen()
    );

    expect(plan.decks).toHaveLength(1);
    expect(plan.decks[0].name).toBe("Untitled deck");
    expect(plan.assignments["c1"]).toBe(plan.decks[0].id);
  });

  it("assigns a deckId to every card and stamps timestamps", () => {
    const cards = [
      { id: "c1", libraryItemId: "item-a" },
      { id: "c2" },
      { id: "c3", libraryItemId: "item-b" },
    ];
    const plan = planDeckMigration(cards, new Map(), NOW, idGen());

    for (const card of cards) {
      expect(plan.assignments[card.id]).toBeTruthy();
    }
    for (const deck of plan.decks) {
      expect(deck.createdAt).toBe(NOW);
      expect(deck.updatedAt).toBe(NOW);
    }
  });

  it("handles empty input", () => {
    const plan = planDeckMigration([], new Map(), NOW, idGen());
    expect(plan.decks).toEqual([]);
    expect(plan.assignments).toEqual({});
  });
});
