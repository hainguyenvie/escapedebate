import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function seedDatabase() {
  const existingDebates = await storage.getDebates();
  if (existingDebates.length === 0) {
    const seeds = [
      { topic: "AI sẽ thay thế hoàn toàn con người trong công việc sáng tạo", side: "oppose" },
      { topic: "Nên áp dụng tuần làm việc 4 ngày", side: "support" },
      { topic: "Giáo dục trực tuyến hiệu quả hơn giáo dục truyền thống", side: "support" }
    ];

    for (const seed of seeds) {
      await storage.createDebate(seed);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.debates.list.path, async (req, res) => {
    const debates = await storage.getDebates();
    res.json(debates);
  });

  app.post(api.debates.create.path, async (req, res) => {
    try {
      const input = api.debates.create.input.parse(req.body);
      const debate = await storage.createDebate(input);
      res.status(201).json(debate);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.debates.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const debate = await storage.getDebate(id);
    if (!debate) {
      return res.status(404).json({ message: "Debate not found" });
    }
    const messages = await storage.getMessages(id);
    res.json({ debate, messages });
  });

  app.post(api.debates.addMessage.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { content } = api.debates.addMessage.input.parse(req.body);
      const debate = await storage.getDebate(id);
      if (!debate) {
        return res.status(404).json({ message: "Debate not found" });
      }

      // 1. Save user message
      await storage.createMessage({
        debate_id: id,
        role: "user",
        content
      });

      // 2. Get history
      const history = await storage.getMessages(id);
      
      // 3. Determine sides
      const userSide = debate.side === "support" ? "Support" : "Oppose";
      const aiSide = debate.side === "support" ? "Oppose" : "Support";

      // 4. Call AI
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are an expert debater in the "ESCAPE AI DEBATE" arena.
            The topic is: "${debate.topic}". 
            The user is arguing for: ${userSide}.
            You must argue for: ${aiSide}.
            
            Guidelines:
            - Keep your arguments sharp, logical, and concise (under 150 words).
            - Do not be overly polite or hedged. Be professional but firm and challenging.
            - Directly address the user's last point.
            - Use a debating style (e.g., "I must disagree with your premise...", "Consider this...").
            - Your goal is to win the debate or at least make the user think hard.
            `
          },
          ...history.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          }))
        ]
      });

      const aiContent = response.choices[0].message.content || "I have no response.";

      // 5. Save AI message
      const aiMessage = await storage.createMessage({
        debate_id: id,
        role: "assistant",
        content: aiContent
      });

      res.status(201).json(aiMessage);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Seed data
  seedDatabase().catch(console.error);

  return httpServer;
}
