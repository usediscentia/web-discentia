import Dexie, { type Table } from "dexie";
import type { Conversation, Message } from "@/types/chat";
import type { Deck, DeckSource } from "@/types/deck";
import type { Exercise } from "@/types/exercise";
import type { SRSCard, ActivityEvent } from "@/types/srs";

class DiscentiaDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  decks!: Table<Deck, string>;
  deckSources!: Table<DeckSource, string>;
  exercises!: Table<Exercise, string>;
  srsCards!: Table<SRSCard, string>;
  activityEvents!: Table<ActivityEvent, string>;

  constructor() {
    super("discentia");

    // v1: original (never modify)
    this.version(1).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
    });

    // v2: library system
    this.version(2).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
      libraries: "id, updatedAt",
      libraryItems: "id, libraryId, createdAt, [libraryId+createdAt], type",
    });

    // v3: exercises
    this.version(3).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
      libraries: "id, updatedAt",
      libraryItems: "id, libraryId, createdAt, [libraryId+createdAt], type",
      exercises: "id, messageId, type, createdAt",
    });

    // v4: SRS + activity
    this.version(4).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
      libraries: "id, updatedAt",
      libraryItems: "id, libraryId, createdAt, [libraryId+createdAt], type",
      exercises: "id, messageId, type, createdAt",
      srsCards: "id, libraryItemId, nextReviewDate, [nextReviewDate+id]",
      activityEvents: "id, type, timestamp",
    });

    // v5: PDF paragraph chunks stored in metadata.chunks (no index changes)
    this.version(5).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
      libraries: "id, updatedAt",
      libraryItems: "id, libraryId, createdAt, [libraryId+createdAt], type",
      exercises: "id, messageId, type, createdAt",
      srsCards: "id, libraryItemId, nextReviewDate, [nextReviewDate+id]",
      activityEvents: "id, type, timestamp",
    });

    // v6: deck-centric clean start — libraries/libraryItems dropped,
    // decks/deckSources created, remaining rows wiped (no migration by design)
    this.version(6)
      .stores({
        conversations: "id, deckId, updatedAt",
        messages: "id, conversationId, timestamp",
        decks: "id, updatedAt",
        deckSources: "id, deckId, createdAt, [deckId+createdAt], type",
        exercises: "id, messageId, type, createdAt",
        srsCards: "id, deckId, sourceId, nextReviewDate, [nextReviewDate+id]",
        activityEvents: "id, type, timestamp",
        libraries: null,
        libraryItems: null,
      })
      .upgrade(async (tx) => {
        await Promise.all([
          tx.table("conversations").clear(),
          tx.table("messages").clear(),
          tx.table("exercises").clear(),
          tx.table("srsCards").clear(),
          tx.table("activityEvents").clear(),
        ]);
      });
  }
}

let db: DiscentiaDB | null = null;

export function getDB(): DiscentiaDB {
  if (!db) {
    db = new DiscentiaDB();
  }
  return db;
}
