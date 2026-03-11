import { nanoid } from "nanoid";
import { getDB } from "./database";
import type {
  Citation,
  Conversation,
  Message,
  Attachment,
} from "@/types/chat";
import type {
  ContentChunk,
  Library,
  LibraryItem,
  LibraryItemMetadata,
  LibraryItemType,
} from "@/types/library";
import type { SRSCard, ActivityEvent } from "@/types/srs";
import type { DashboardInsights, DashboardStats } from "@/types/dashboard";

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

export interface MatchedChunk {
  chunk: ContentChunk;
  chunkScore: number;
}

export interface ScoredLibraryItem {
  item: LibraryItem;
  score: number;
  matchedChunks?: MatchedChunk[]; // top chunks for items with chunk metadata
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

function toDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentStreak(reviewDays: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = toDayKey(cursor.getTime());
    if (!reviewDays.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getBestStreak(reviewDays: Set<string>): number {
  if (reviewDays.size === 0) return 0;
  const sorted = [...reviewDays].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`).getTime();
    const curr = new Date(`${sorted[i]}T00:00:00`).getTime();
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
      continue;
    }
    current = 1;
  }

  return best;
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
    updates: Partial<Pick<LibraryItem, "title" | "content" | "preview" | "metadata" | "type">>
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
        let titleScore = 0;

        if (!query) {
          return { item, score: 1 };
        }

        if (title.includes(query)) titleScore += 40;
        for (const token of tokens) {
          if (title.includes(token)) titleScore += 8;
        }

        const chunks = item.metadata?.chunks;
        if (chunks && chunks.length > 0) {
          // Score at chunk level for items with paragraph metadata
          const scoredChunks: MatchedChunk[] = chunks.map((chunk) => {
            const chunkText = chunk.text.toLowerCase();
            let chunkScore = 0;
            if (chunkText.includes(query)) chunkScore += 18;
            for (const token of tokens) {
              if (chunkText.includes(token)) chunkScore += 3;
            }
            return { chunk, chunkScore };
          }).filter((c) => c.chunkScore > 0)
            .sort((a, b) => b.chunkScore - a.chunkScore);

          const topChunkScore = scoredChunks.slice(0, 3).reduce((sum, c) => sum + c.chunkScore, 0);
          const score = titleScore + topChunkScore;
          return { item, score, matchedChunks: scoredChunks };
        }

        // Fallback for legacy items without chunks
        const content = item.content.toLowerCase();
        let score = titleScore;
        if (content.includes(query)) score += 18;
        for (const token of tokens) {
          if (content.includes(token)) score += 3;
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

  async searchConversations(
    query: string,
    limit = 5
  ): Promise<{ conversation: Conversation; messageId: string; snippet: string }[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const db = getDB();
    const conversations = await db.conversations.toArray();
    const results: { conversation: Conversation; messageId: string; snippet: string; score: number }[] = [];

    for (const conversation of conversations) {
      // Search in conversation title
      if (conversation.title.toLowerCase().includes(q)) {
        const messages = await db.messages
          .where("conversationId")
          .equals(conversation.id)
          .toArray();
        const firstMatchMsg = messages.find((m) =>
          m.content.toLowerCase().includes(q)
        );
        let snippet = conversation.title;
        let messageId = "";
        if (firstMatchMsg) {
          const normalized = firstMatchMsg.content.replace(/\s+/g, " ");
          const idx = normalized.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(normalized.length, idx + q.length + 60);
          snippet =
            (start > 0 ? "\u2026" : "") +
            normalized.slice(start, end) +
            (end < normalized.length ? "\u2026" : "");
          messageId = firstMatchMsg.id;
        }
        results.push({ conversation, messageId, snippet, score: 40 });
        continue;
      }

      // Search in messages
      const messages = await db.messages
        .where("conversationId")
        .equals(conversation.id)
        .toArray();

      for (const message of messages) {
        const normalized = message.content.replace(/\s+/g, " ");
        const idx = normalized.toLowerCase().indexOf(q);
        if (idx === -1) continue;

        const start = Math.max(0, idx - 40);
        const end = Math.min(normalized.length, idx + q.length + 60);
        const snippet = (start > 0 ? "\u2026" : "") + normalized.slice(start, end) + (end < normalized.length ? "\u2026" : "");

        results.push({
          conversation,
          messageId: message.id,
          snippet,
          score: 20,
        });
        break; // one result per conversation
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ conversation, messageId, snippet }) => ({ conversation, messageId, snippet }));
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

    const reviewDays = new Set(srsReviewEvents.map((e) => toDayKey(e.timestamp)));
    const streak = getCurrentStreak(reviewDays);

    const activityByDay: Record<string, number> = {};
    const heatStart = Date.now() - 180 * 86400000;
    srsReviewEvents
      .filter((e) => e.timestamp >= heatStart)
      .forEach((e) => {
        const key = toDayKey(e.timestamp);
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

  async getDashboardInsights(): Promise<DashboardInsights> {
    const db = getDB();
    const now = Date.now();

    const [cards, libraryItems, libraries, events] = await Promise.all([
      db.srsCards.toArray(),
      db.libraryItems.toArray(),
      db.libraries.toArray(),
      db.activityEvents.orderBy("timestamp").reverse().limit(12).toArray(),
    ]);

    const libraryById = new Map(libraries.map((library) => [library.id, library]));
    const itemById = new Map(libraryItems.map((item) => [item.id, item]));

    const dueByLibraryCounter = new Map<string, { libraryId: string | null; name: string; dueCount: number }>();
    for (const card of cards) {
      if (card.nextReviewDate > now) continue;
      const item = card.libraryItemId ? itemById.get(card.libraryItemId) : undefined;
      const library = item ? libraryById.get(item.libraryId) : undefined;
      const key = library?.id ?? "__general__";
      const current = dueByLibraryCounter.get(key) ?? {
        libraryId: library?.id ?? null,
        name: library?.name ?? "General",
        dueCount: 0,
      };
      current.dueCount += 1;
      dueByLibraryCounter.set(key, current);
    }

    const dueByLibrary = [...dueByLibraryCounter.values()]
      .sort((a, b) => b.dueCount - a.dueCount)
      .slice(0, 4);

    const nowDate = new Date(now);
    const tomorrowStart = new Date(nowDate);
    tomorrowStart.setHours(24, 0, 0, 0);
    const tomorrowStartTs = tomorrowStart.getTime();
    const tomorrowEndTs = tomorrowStartTs + 86400000;

    const startOfNextWeek = new Date(tomorrowStart);
    const daysUntilSunday = (7 - startOfNextWeek.getDay()) % 7;
    startOfNextWeek.setDate(startOfNextWeek.getDate() + daysUntilSunday);
    const startOfNextWeekTs = startOfNextWeek.getTime();
    const startOfFollowingWeekTs = startOfNextWeekTs + 7 * 86400000;

    const countInRange = (start: number, end: number) =>
      cards.filter(
        (card) => card.nextReviewDate >= start && card.nextReviewDate < end
      ).length;

    const upcomingReviews = [
      {
        label: "In 1 hour",
        dueCount: countInRange(now, now + 3600000),
        timestamp: now,
      },
      {
        label: "Later today",
        dueCount: countInRange(now + 3600000, tomorrowStartTs),
        timestamp: now + 3600000,
      },
      {
        label: "Tomorrow",
        dueCount: countInRange(tomorrowStartTs, tomorrowEndTs),
        timestamp: tomorrowStartTs,
      },
      {
        label: "This week",
        dueCount: countInRange(
          tomorrowEndTs,
          Math.max(tomorrowEndTs, startOfNextWeekTs)
        ),
        timestamp: tomorrowEndTs,
      },
      {
        label: "Next week",
        dueCount: countInRange(
          Math.max(tomorrowEndTs, startOfNextWeekTs),
          Math.max(startOfFollowingWeekTs, tomorrowEndTs)
        ),
        timestamp: Math.max(tomorrowEndTs, startOfNextWeekTs),
      },
    ];

    const reviewEvents = events.filter((event) => event.type === "srs_review");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const reviewedThisMonth = reviewEvents.filter(
      (event) => event.timestamp >= monthStart.getTime()
    ).length;

    const reviewedLast7Days = reviewEvents.filter(
      (event) => event.timestamp >= now - 7 * 86400000
    ).length;
    const reviewedPrev7Days = reviewEvents.filter(
      (event) =>
        event.timestamp < now - 7 * 86400000 &&
        event.timestamp >= now - 14 * 86400000
    ).length;

    const allReviewEvents = await db.activityEvents.where("type").equals("srs_review").toArray();
    const reviewDays = new Set(allReviewEvents.map((event) => toDayKey(event.timestamp)));
    const bestStreak = getBestStreak(reviewDays);

    return {
      dueByLibrary,
      upcomingReviews,
      recentActivity: events.slice(0, 4),
      reviewedThisMonth,
      reviewedLast7Days,
      reviewedPrev7Days,
      bestStreak,
    };
  },
};
