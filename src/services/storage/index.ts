import { nanoid } from "nanoid";
import { getDB } from "./database";
import type {
  Citation,
  Conversation,
  Message,
  Attachment,
} from "@/types/chat";
import type {
  Library,
  LibraryItem,
  LibraryItemMetadata,
  LibraryItemType,
} from "@/types/library";
import type { SRSCard, ActivityEvent } from "@/types/srs";
import type { DashboardStats } from "@/types/dashboard";

export interface CreateLibraryInput {
  name: string;
  color: string;
  description?: string;
}

export interface CreateLibraryItemInput {
  libraryId: string;
  type: LibraryItemType;
  title: string;
  content: string;
  preview?: string;
  rawFile?: Blob;
  metadata?: LibraryItemMetadata;
}

export interface SearchLibraryItemsInput {
  query: string;
  libraryIds?: string[];
  limit?: number;
}

export interface ScoredLibraryItem {
  item: LibraryItem;
  score: number;
}

export interface CreateSRSCardInput {
  front: string;
  back: string;
  libraryItemId?: string;
}

async function syncLibraryItemCount(libraryId: string): Promise<void> {
  const count = await getDB()
    .libraryItems.where("libraryId")
    .equals(libraryId)
    .count();
  await getDB().libraries.update(libraryId, {
    itemCount: count,
    updatedAt: Date.now(),
  });
}

export const StorageService = {
  async createConversation(
    title = "New Chat",
    libraryIds: string[] = []
  ): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: nanoid(),
      title,
      libraryIds,
      createdAt: now,
      updatedAt: now,
    };
    await getDB().conversations.add(conversation);
    return conversation;
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    return getDB().conversations.get(id);
  },

  async listConversations(): Promise<Conversation[]> {
    return getDB().conversations.orderBy("updatedAt").reverse().toArray();
  },

  async updateConversation(
    id: string,
    updates: Partial<Pick<Conversation, "title" | "updatedAt" | "libraryIds">>
  ): Promise<void> {
    await getDB().conversations.update(id, updates);
  },

  async deleteConversation(id: string): Promise<void> {
    const db = getDB();
    await db.messages.where("conversationId").equals(id).delete();
    await db.conversations.delete(id);
  },

  async addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    extras?: {
      citations?: Citation[];
      attachments?: Attachment[];
      exerciseId?: string;
    }
  ): Promise<Message> {
    const message: Message = {
      id: nanoid(),
      conversationId,
      role,
      content,
      citations: extras?.citations,
      attachments: extras?.attachments,
      exerciseId: extras?.exerciseId,
      timestamp: Date.now(),
    };
    await getDB().messages.add(message);
    await getDB().conversations.update(conversationId, {
      updatedAt: Date.now(),
    });
    return message;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return getDB()
      .messages.where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
  },

  async deleteMessage(id: string): Promise<void> {
    await getDB().messages.delete(id);
  },

  async createLibrary(input: CreateLibraryInput): Promise<Library> {
    const now = Date.now();
    const library: Library = {
      id: nanoid(),
      name: input.name.trim(),
      color: input.color,
      description: input.description?.trim() || undefined,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await getDB().libraries.add(library);
    return library;
  },

  async getLibrary(id: string): Promise<Library | undefined> {
    return getDB().libraries.get(id);
  },

  async listLibraries(): Promise<Library[]> {
    return getDB().libraries.orderBy("updatedAt").reverse().toArray();
  },

  async updateLibrary(
    id: string,
    updates: Partial<Pick<Library, "name" | "color" | "description">>
  ): Promise<void> {
    await getDB().libraries.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async deleteLibrary(id: string): Promise<void> {
    const db = getDB();
    await db.transaction("rw", db.libraries, db.libraryItems, db.conversations, async () => {
      await db.libraryItems.where("libraryId").equals(id).delete();
      await db.libraries.delete(id);

      const conversations = await db.conversations.toArray();
      const affected = conversations.filter((conversation) =>
        conversation.libraryIds?.includes(id)
      );
      await Promise.all(
        affected.map((conversation) =>
          db.conversations.update(conversation.id, {
            libraryIds: (conversation.libraryIds || []).filter(
              (libraryId) => libraryId !== id
            ),
            updatedAt: Date.now(),
          })
        )
      );
    });
  },

  async createLibraryItem(input: CreateLibraryItemInput): Promise<LibraryItem> {
    const now = Date.now();
    const item: LibraryItem = {
      id: nanoid(),
      libraryId: input.libraryId,
      type: input.type,
      title: input.title.trim() || "Untitled",
      content: input.content,
      preview: input.preview?.trim() || input.content.slice(0, 180),
      rawFile: input.rawFile,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    await getDB().libraryItems.add(item);
    await syncLibraryItemCount(input.libraryId);
    return item;
  },

  async getLibraryItem(id: string): Promise<LibraryItem | undefined> {
    return getDB().libraryItems.get(id);
  },

  async listLibraryItems(libraryId?: string): Promise<LibraryItem[]> {
    if (libraryId) {
      const items = await getDB()
        .libraryItems.where("libraryId")
        .equals(libraryId)
        .toArray();
      return items.sort((a, b) => b.createdAt - a.createdAt);
    }

    return getDB().libraryItems.orderBy("createdAt").reverse().toArray();
  },

  async updateLibraryItem(
    id: string,
    updates: Partial<Pick<LibraryItem, "title" | "content" | "preview" | "metadata">>
  ): Promise<void> {
    await getDB().libraryItems.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async deleteLibraryItem(id: string): Promise<void> {
    const existing = await getDB().libraryItems.get(id);
    if (!existing) return;

    await getDB().libraryItems.delete(id);
    await syncLibraryItemCount(existing.libraryId);
  },

  async searchLibraryItems(
    input: SearchLibraryItemsInput
  ): Promise<ScoredLibraryItem[]> {
    const query = input.query.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const limit = input.limit ?? 25;
    let items: LibraryItem[] = [];

    if (input.libraryIds && input.libraryIds.length > 0) {
      items = await getDB()
        .libraryItems.where("libraryId")
        .anyOf(input.libraryIds)
        .toArray();
    } else {
      items = await getDB().libraryItems.toArray();
    }

    const scored = items
      .map((item) => {
        const title = item.title.toLowerCase();
        const content = item.content.toLowerCase();
        let score = 0;

        if (!query) {
          score = 1;
        } else {
          if (title.includes(query)) score += 40;
          if (content.includes(query)) score += 18;

          for (const token of tokens) {
            if (title.includes(token)) score += 8;
            if (content.includes(token)) score += 3;
          }
        }

        return { item, score };
      })
      .filter((entry) => (query ? entry.score > 0 : true))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.item.updatedAt - a.item.updatedAt;
      });

    return scored.slice(0, limit);
  },

  async createSRSCards(inputs: CreateSRSCardInput[]): Promise<SRSCard[]> {
    const now = Date.now();
    const cards: SRSCard[] = inputs.map((input) => ({
      id: nanoid(),
      libraryItemId: input.libraryItemId,
      front: input.front,
      back: input.back,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now,
      lastReviewDate: null,
      lapses: 0,
      createdAt: now,
    }));
    await getDB().srsCards.bulkAdd(cards);
    return cards;
  },

  async getDueCards(limit = 20): Promise<SRSCard[]> {
    const now = Date.now();
    const due = await getDB()
      .srsCards.where("nextReviewDate")
      .belowOrEqual(now)
      .limit(limit)
      .toArray();
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    return due;
  },

  async updateSRSCard(id: string, updates: Partial<SRSCard>): Promise<void> {
    await getDB().srsCards.update(id, updates);
  },

  async logActivityEvent(
    type: ActivityEvent["type"],
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await getDB().activityEvents.add({
      id: nanoid(),
      type,
      description,
      metadata,
      timestamp: Date.now(),
    });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const db = getDB();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();

    const [dueCards, allCards, libraryItems, srsReviewEvents] = await Promise.all([
      db.srsCards.where("nextReviewDate").belowOrEqual(now).count(),
      db.srsCards.toArray(),
      db.libraryItems.count(),
      db.activityEvents.where("type").equals("srs_review").toArray(),
    ]);

    const reviewedToday = srsReviewEvents.filter((e) => e.timestamp >= todayTs).length;

    const reviewDays = new Set(
      srsReviewEvents.map((e) => {
        const d = new Date(e.timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    );
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (!reviewDays.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const activityByDay: Record<string, number> = {};
    const heatStart = Date.now() - 70 * 86400000;
    srsReviewEvents
      .filter((e) => e.timestamp >= heatStart)
      .forEach((e) => {
        const d = new Date(e.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        activityByDay[key] = (activityByDay[key] ?? 0) + 1;
      });

    const masteredCards = allCards.filter((c) => c.interval >= 21).length;

    return {
      dueToday: dueCards,
      reviewedToday,
      streak,
      totalCards: allCards.length,
      masteredCards,
      libraryItemCount: libraryItems,
      activityByDay,
    };
  },
};
