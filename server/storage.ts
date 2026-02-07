import type { Debate, InsertDebate, Message, InsertMessage } from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  createDebate(debate: InsertDebate): Promise<Debate>;
  getDebate(id: number): Promise<Debate | undefined>;
  getDebates(): Promise<Debate[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(debateId: number): Promise<Message[]>;
}

export class SupabaseStorage implements IStorage {
  async createDebate(debate: InsertDebate): Promise<Debate> {
    const { data, error } = await supabase
      .from("debates")
      .insert(debate)
      .select()
      .single();

    if (error) throw new Error(`Failed to create debate: ${error.message}`);
    return data;
  }

  async getDebate(id: number): Promise<Debate | undefined> {
    const { data, error } = await supabase
      .from("debates")
      .select()
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async getDebates(): Promise<Debate[]> {
    const { data, error } = await supabase
      .from("debates")
      .select()
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get debates: ${error.message}`);
    return data || [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert(message)
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return data;
  }

  async getMessages(debateId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select()
      .eq("debate_id", debateId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data || [];
  }
}

export const storage = new SupabaseStorage();
