import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./app.store";

describe("app.store navigation", () => {
  beforeEach(() => {
    useAppStore.setState({ activeView: "decks", selectedDeckId: null });
  });

  it("defaults to decks view with no deck selected", () => {
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
  });

  it("openDeck selects deck and forces decks view", () => {
    useAppStore.getState().setActiveView("study");
    useAppStore.getState().openDeck("d1");
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBe("d1");
  });

  it("closeDeck clears selection, stays on decks", () => {
    useAppStore.getState().openDeck("d1");
    useAppStore.getState().closeDeck();
    expect(useAppStore.getState().selectedDeckId).toBeNull();
    expect(useAppStore.getState().activeView).toBe("decks");
  });

  it("setActiveView clears deck selection", () => {
    useAppStore.getState().openDeck("d1");
    useAppStore.getState().setActiveView("study");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
    useAppStore.getState().setActiveView("decks");
    expect(useAppStore.getState().activeView).toBe("decks");
    expect(useAppStore.getState().selectedDeckId).toBeNull();
  });
});
