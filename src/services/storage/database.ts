import Dexie, { type Table } from "dexie";
import { nanoid } from "nanoid";
import type { Conversation, Message } from "@/types/chat";
import type { Library, LibraryItem } from "@/types/library";
import type { Exercise } from "@/types/exercise";
import type { SRSCard, ActivityEvent, Deck } from "@/types/srs";
import { planDeckMigration } from "./deck-migration";

class DiscentiaDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  libraries!: Table<Library, string>;
  libraryItems!: Table<LibraryItem, string>;
  exercises!: Table<Exercise, string>;
  srsCards!: Table<SRSCard, string>;
  activityEvents!: Table<ActivityEvent, string>;
  decks!: Table<Deck, string>;

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

    // v6: decks table + deckId on cards
    this.version(6)
      .stores({
        conversations: "id, updatedAt",
        messages: "id, conversationId, timestamp",
        libraries: "id, updatedAt",
        libraryItems: "id, libraryId, createdAt, [libraryId+createdAt], type",
        exercises: "id, messageId, type, createdAt",
        srsCards: "id, deckId, libraryItemId, nextReviewDate, [nextReviewDate+id]",
        activityEvents: "id, type, timestamp",
        decks: "id, updatedAt",
      })
      .upgrade(async (tx) => {
        const cards = await tx.table<SRSCard>("srsCards").toArray();
        if (cards.length === 0) return;

        const items = await tx.table<LibraryItem>("libraryItems").toArray();
        const itemTitles = new Map(items.map((item) => [item.id, item.title]));

        const plan = planDeckMigration(cards, itemTitles, Date.now(), nanoid);

        await tx.table<Deck>("decks").bulkAdd(plan.decks);
        await tx
          .table<SRSCard>("srsCards")
          .toCollection()
          .modify((card) => {
            card.deckId = plan.assignments[card.id];
          });
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
