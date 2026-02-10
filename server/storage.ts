import type { Debate, InsertDebate, Message, InsertMessage } from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  createDebate(debate: InsertDebate): Promise<Debate>;
  getDebate(id: number): Promise<Debate | undefined>;
  getDebates(): Promise<Debate[]>;
  deleteDebate(id: number): Promise<void>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(debateId: number): Promise<Message[]>;
  updateDebateRound(id: number, round: number): Promise<void>;
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

  async deleteDebate(id: number): Promise<void> {
    // Delete messages first (foreign key constraint)
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("debate_id", id);

    if (messagesError) {
      throw new Error(`Failed to delete messages: ${messagesError.message}`);
    }

    // Then delete the debate
    const { error: debateError } = await supabase
      .from("debates")
      .delete()
      .eq("id", id);

    if (debateError) {
      throw new Error(`Failed to delete debate: ${debateError.message}`);
    }
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

  async updateDebateRound(id: number, round: number): Promise<void> {
    const { error } = await supabase
      .from("debates")
      .update({ current_round: round })
      .eq("id", id);

    if (error) throw new Error(`Failed to update debate round: ${error.message}`);
  }
}

export const storage = new SupabaseStorage();
