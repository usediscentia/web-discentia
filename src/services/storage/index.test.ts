import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { StorageService } from "./index";

beforeEach(async () => {
  await StorageService.clearAllData();
});

describe("deck CRUD", () => {
  it("creates a deck with cardCount 0 and lists it", async () => {
    const deck = await StorageService.createDeck({ name: "Anatomia", color: "#34D399" });
    expect(deck.cardCount).toBe(0);
    const decks = await StorageService.listDecks();
    expect(decks.map((d) => d.id)).toContain(deck.id);
  });

  it("scopes sources to a deck", async () => {
    const a = await StorageService.createDeck({ name: "A", color: "#000" });
    const b = await StorageService.createDeck({ name: "B", color: "#000" });
    await StorageService.createDeckSource({ deckId: a.id, type: "text", title: "t1", content: "conteudo um" });
    await StorageService.createDeckSource({ deckId: b.id, type: "text", title: "t2", content: "conteudo dois" });
    const sourcesA = await StorageService.listDeckSources(a.id);
    expect(sourcesA).toHaveLength(1);
    expect(sourcesA[0].deckId).toBe(a.id);
  });

  it("deleteDeck cascades sources, cards and deck conversations", async () => {
    const deck = await StorageService.createDeck({ name: "A", color: "#000" });
    const source = await StorageService.createDeckSource({ deckId: deck.id, type: "text", title: "t", content: "c" });
    await StorageService.createSRSCards(deck.id, [{ front: "f", back: "b", sourceId: source.id }]);
    const conv = await StorageService.createConversation("chat", deck.id);
    await StorageService.addMessage(conv.id, "user", "oi");

    await StorageService.deleteDeck(deck.id);

    expect(await StorageService.getDeck(deck.id)).toBeUndefined();
    expect(await StorageService.listDeckSources(deck.id)).toHaveLength(0);
    expect(await StorageService.listDeckCards(deck.id)).toHaveLength(0);
    expect(await StorageService.getConversation(conv.id)).toBeUndefined();
    expect(await StorageService.getMessages(conv.id)).toHaveLength(0);
  });
});
