import { z } from "zod";

export interface Debate {
  id: number;
  topic: string;
  side: string;
  created_at: string;
}

export interface Message {
  id: number;
  debate_id: number;
  role: string;
  content: string;
  created_at: string;
}

export const insertDebateSchema = z.object({
  topic: z.string().min(1),
  side: z.string().min(1),
});

export const insertMessageSchema = z.object({
  debate_id: z.number(),
  role: z.string().min(1),
  content: z.string().min(1),
});

export type InsertDebate = z.infer<typeof insertDebateSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
