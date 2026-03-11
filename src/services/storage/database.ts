import Dexie, { type Table } from "dexie";
import type { Conversation, Message } from "@/types/chat";
import type { Library, LibraryItem } from "@/types/library";
import type { Exercise } from "@/types/exercise";
import type { SRSCard, ActivityEvent } from "@/types/srs";

class DiscentiaDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  libraries!: Table<Library, string>;
  libraryItems!: Table<LibraryItem, string>;
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
  }
}

let db: DiscentiaDB | null = null;

export function getDB(): DiscentiaDB {
  if (!db) {
    db = new DiscentiaDB();
  }
  return db;
}
