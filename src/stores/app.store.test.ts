import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./app.store";

describe("app.store deck detail", () => {
  beforeEach(() => {
    useAppStore.getState().setDeckDetail(null);
  });

  it("opens deck detail for a deck", () => {
    useAppStore.getState().setDeckDetail("deck-1");
    expect(useAppStore.getState().deckDetailId).toBe("deck-1");
    expect(useAppStore.getState().deckDetailCardId).toBeNull();
  });

  it("opens deck detail highlighting a card", () => {
    useAppStore.getState().setDeckDetail("deck-1", "card-9");
    expect(useAppStore.getState().deckDetailId).toBe("deck-1");
    expect(useAppStore.getState().deckDetailCardId).toBe("card-9");
  });

  it("clearing the deck also clears the highlighted card", () => {
    useAppStore.getState().setDeckDetail("deck-1", "card-9");
    useAppStore.getState().setDeckDetail(null);
    expect(useAppStore.getState().deckDetailId).toBeNull();
    expect(useAppStore.getState().deckDetailCardId).toBeNull();
  });

  it("clears only the card highlight after consumption", () => {
    useAppStore.getState().setDeckDetail("deck-1", "card-9");
    useAppStore.getState().clearDeckDetailCard();
    expect(useAppStore.getState().deckDetailId).toBe("deck-1");
    expect(useAppStore.getState().deckDetailCardId).toBeNull();
  });
});
