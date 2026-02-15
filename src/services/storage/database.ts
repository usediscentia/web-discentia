import Dexie, { type Table } from "dexie";
import type { Conversation, Message } from "@/types/chat";

class DiscentiaDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;

  constructor() {
    super("discentia");
    this.version(1).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, timestamp",
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
