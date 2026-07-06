import type { Deck } from "@/types/srs";

export const INBOX_DECK_ID = "inbox";
export const INBOX_DECK_NAME = "Inbox";
const UNTITLED_DECK_NAME = "Untitled deck";

export interface DeckMigrationPlan {
  decks: Deck[];
  /** cardId → deckId for every existing card */
  assignments: Record<string, string>;
}

/**
 * Plans the v5 → v6 deck migration: one deck per distinct libraryItemId
 * (named after the item, "Untitled deck" if the item no longer exists),
 * plus an "Inbox" deck only if orphan cards exist.
 */
export function planDeckMigration(
  cards: Array<{ id: string; libraryItemId?: string }>,
  itemTitles: Map<string, string>,
  now: number,
  generateId: () => string
): DeckMigrationPlan {
  const decks: Deck[] = [];
  const assignments: Record<string, string> = {};
  const deckIdByItem = new Map<string, string>();
  let inboxCreated = false;

  for (const card of cards) {
    if (!card.libraryItemId) {
      if (!inboxCreated) {
        decks.push({
          id: INBOX_DECK_ID,
          name: INBOX_DECK_NAME,
          createdAt: now,
          updatedAt: now,
        });
        inboxCreated = true;
      }
      assignments[card.id] = INBOX_DECK_ID;
      continue;
    }

    let deckId = deckIdByItem.get(card.libraryItemId);
    if (!deckId) {
      deckId = generateId();
      deckIdByItem.set(card.libraryItemId, deckId);
      decks.push({
        id: deckId,
        name: itemTitles.get(card.libraryItemId) ?? UNTITLED_DECK_NAME,
        createdAt: now,
        updatedAt: now,
      });
    }
    assignments[card.id] = deckId;
  }

  return { decks, assignments };
}
