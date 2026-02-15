import { nanoid } from "nanoid";
import { getDB } from "./database";
import type { Conversation, Message } from "@/types/chat";

export const StorageService = {
  async createConversation(title = "New Chat"): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: nanoid(),
      title,
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
    updates: Partial<Pick<Conversation, "title" | "updatedAt">>
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
    content: string
  ): Promise<Message> {
    const message: Message = {
      id: nanoid(),
      conversationId,
      role,
      content,
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
};
