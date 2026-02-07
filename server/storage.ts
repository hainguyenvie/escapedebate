import { debates, messages, type Debate, type InsertDebate, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createDebate(debate: InsertDebate): Promise<Debate>;
  getDebate(id: number): Promise<Debate | undefined>;
  getDebates(): Promise<Debate[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(debateId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createDebate(debate: InsertDebate): Promise<Debate> {
    const [newDebate] = await db.insert(debates).values(debate).returning();
    return newDebate;
  }

  async getDebate(id: number): Promise<Debate | undefined> {
    const [debate] = await db.select().from(debates).where(eq(debates.id, id));
    return debate;
  }

  async getDebates(): Promise<Debate[]> {
    return await db.select().from(debates).orderBy(desc(debates.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessages(debateId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.debateId, debateId)).orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();
