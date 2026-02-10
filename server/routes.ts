import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

      // Call LLM to refine topic and create moderator intro
      const sideText = input.side === "support" ? "Ủng hộ" : "Phản đối";
      const oppositeSideText = input.side === "support" ? "Phản đối" : "Ủng hộ";

      const refinementResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia điều phối cuộc tranh luận chuyên nghiệp. Nhiệm vụ:

1. PARAPHRASE chủ đề thành một Motion (câu khẳng định) chau chuốt, rõ ràng, có tính debatable cao
2. Tạo phần tóm tắt và hướng dẫn cho vòng tranh luận

Trả về JSON:
{
  "refined_topic": "Motion đã cải thiện - câu khẳng định rõ ràng, cụ thể, có thể tranh luận",
  "summary": "Tóm tắt ngắn gọn về chủ đề và tại sao nó có tính debatable",
  "guidance": "Hướng dẫn chi tiết cho cả hai bên trong vòng mở đầu"
}

VÍ DỤ về refined_topic tốt:
- Input: "con chó không hơn con mèo" -> Output: "Chó là thú cưng phù hợp hơn mèo cho gia đình có trẻ nhỏ"
- Input: "AI giáo dục" -> Output: "Trí tuệ nhân tạo sẽ thay thế hoàn toàn giáo viên trong giáo dục phổ thông trong vòng 10 năm tới"

YÊU CẦU:
- refined_topic: Phải là câu KHẲNG ĐỊNH (motion) rõ ràng, cụ thể, có phạm vi/thời gian nếu cần. KHÔNG chỉ copy nguyên input.
- summary: 1-2 câu giải thích tại sao chủ đề này có thể tranh luận được
- guidance: Hướng dẫn cụ thể về cách tranh luận, độ dài phát biểu, điều cần lưu ý`
          },
          {
            role: "user",
            content: `Chủ đề gốc từ người dùng: "${input.topic}"\nNgười dùng đứng về phía: ${sideText}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const refinedData = JSON.parse(refinementResponse.choices[0].message.content || "{}");

      // Xác định tên bên và hành động
      const userSideName = input.side === "support" ? "Khẳng định" : "Phủ định";
      const userAction = input.side === "support" ? "Ủng hộ" : "Phản đối";
      const aiSideName = input.side === "support" ? "Phủ định" : "Khẳng định";
      const aiAction = input.side === "support" ? "Phản đối" : "Ủng hộ";

      // Tạo moderator intro với format đầy đủ
      const moderatorIntro = `Vòng 1: Phát biểu mở đầu

1️⃣ Bên ${userSideName} - ${userAction}: Đưa ra phát biểu, tuyên bố ${userAction} Motion
2️⃣ Bên ${aiSideName} - ${aiAction}: Đưa ra phát biểu, tuyên bố ${aiAction} Motion

📋 YÊU CẦU:
+ ${refinedData.summary || 'Một chủ đề cụ thể và thực sự có thể tranh luận được (có tính debatable)'}

+ ${refinedData.guidance || 'Mỗi bên hãy trình bày lập luận mở đầu rõ ràng, mạch lạc. Tập trung vào luận điểm chính và bằng chứng ủng hộ quan điểm của mình.'}`;

      const debate = await storage.createDebate({
        ...input,
        refined_topic: refinedData.refined_topic || input.topic,
        current_round: 1,
        moderator_intro: moderatorIntro
      });

      // LOGIC MỚI: Nếu người dùng chọn phe PHẢN ĐỐI (Oppose)
      // Thì AI là phe ỦNG HỘ (Support) và phải NÓI TRƯỚC (Opening Statement)
      if (input.side === "oppose") {
        const aiOpeningPrompt = `Bạn là chuyên gia tranh luận trong "ESCAPE AI DEBATE".
🎯 MOTION: "${debate.refined_topic}"
📌 VỊ TRÍ CỦA BẠN: Bên KHẲNG ĐỊNH - ỦNG HỘ Motion.
📌 ĐỐI THỦ: Bên PHỦ ĐỊNH - PHẢN ĐỐI Motion.

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU (AI ĐI TRƯỚC):
Bạn có nhiệm vụ mở màn cuộc tranh luận. Hãy đưa ra hệ thống luận điểm ủng hộ Motion một cách vững chắc.

📋 YÊU CẦU NỘI DUNG:
1. Định nghĩa rõ ràng Motion (Model debate).
2. Đưa ra 2-3 luận điểm cốt lõi (Core arguments) để bảo vệ Motion.
3. Vì bạn nói trước, hãy thiết lập "Burden of Proof" (Gánh nặng chứng minh) cho phe Phản đối.

⚡ CHIẾN THUẬT:
- Phong thái tự tin, tiên phong.
- Dự đoán trước các luận điểm phản đối và chặn trước (Pre-empting).

📏 ĐỘ DÀI: 150-200 từ.`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: aiOpeningPrompt }]
        });

        const aiContent = aiResponse.choices[0].message.content || "Tôi xin đưa ra luận điểm mở đầu.";

        await storage.createMessage({
          debate_id: debate.id,
          role: "assistant",
          content: aiContent
        });
      }

      res.status(201).json(debate);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Create debate error:", err);
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

  app.delete("/api/debates/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteDebate(id);
      res.status(204).end();
    } catch (error) {
      console.error("Delete debate error:", error);
      res.status(500).json({ message: "Failed to delete debate" });
    }
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
      const userSide = debate.side === "support" ? "Khẳng định" : "Phủ định";
      const userSideAction = debate.side === "support" ? "Ủng hộ" : "Phản đối";
      const aiSide = debate.side === "support" ? "Phủ định" : "Khẳng định";
      const aiSideAction = debate.side === "support" ? "Phản đối" : "Ủng hộ";

      // Lấy motion đã được refined (nếu có)
      const motion = debate.refined_topic || debate.topic;
      const currentRound = debate.current_round || 1;

      // Tính toán next round info trước để dùng chung
      const nextRound = currentRound + 1;
      const isLastRound = currentRound >= 5;
      const nextRoundName = isLastRound ? "KẾT THÚC DEBATE"
        : nextRound === 2 ? "Vòng 2: Đưa ra 3 lập luận chính kèm bằng chứng"
          : nextRound === 3 ? "Vòng 3: Phản bác chéo"
            : nextRound === 4 ? "Vòng 4: Tổng kết"
              : "Vòng 5: Kết luận";

      // =================================================================================
      // LOGIC XỬ LÝ THEO PHE (SIDE)
      // =================================================================================

      let aiMessage = null; // Để return cho client nếu có

      if (debate.side === 'support') {
        // SCENARIO A: USER LÀ ỦNG HỘ (SUPPORT)
        // Flow: User nói trước (đã lưu ở trên) -> AI phản biện (kết thúc vòng) -> Moderator -> Close Round

        let systemPrompt = '';
        if (currentRound === 1) {
          systemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION: "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - ${aiSideAction} Motion
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU:
Dựa vào Motion, đưa ra lập luận ${aiSideAction.toLowerCase()} Motion một cách sắc bén và thuyết phục.
(Tham chiếu logic cũ: Phản biện lại User vừa nói)`;
        } else if (currentRound === 2) {
          systemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}". Vòng 2.
Vị trí: Bên ${aiSide}. Nhiệm vụ: Triển khai 3 Lập luận Chính (3 Pillars) có bằng chứng để phản bác đối thủ.`;
        } else if (currentRound === 3) {
          systemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}". Vòng 3 - Phản bác chéo.
Vị trí: Bên ${aiSide}. Nhiệm vụ: Đặt câu hỏi chất vấn và bóc tách mâu thuẫn của đối thủ.`;
        } else if (currentRound === 4) {
          systemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}". Vòng 4 - Tổng kết.
Vị trí: Bên ${aiSide}. Nhiệm vụ: Chứng minh tại sao bên bạn thắng thế qua các Clash points.`;
        } else {
          systemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}". Vòng 5 - Kết luận.
Vị trí: Bên ${aiSide}. Nhiệm vụ: Final Statement cảm xúc.`;
        }


        // 5. Call AI (Phản biện lại User)
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
          ]
        });

        const aiContent = response.choices[0].message.content || "Tôi không có phản hồi.";

        // Lưu AI Message
        aiMessage = await storage.createMessage({
          debate_id: id,
          role: "assistant",
          content: aiContent
        });

        // 6. Moderator Summary
        await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);

      } else {
        // SCENARIO B: USER LÀ PHẢN ĐỐI (OPPOSE)
        // Flow: 
        // 1. AI (Support) đã nói mở đầu round (đã có trong history hoặc create debate)
        // 2. User (Oppose) vừa nói (đã lưu ở bước 1) -> Đây là lượt KẾT THÚC VÒNG.

        // --- 1. Moderator Summary NGAY LẬP TỨC (vì vòng đã hết) ---
        await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);

        // --- 2. Nếu chưa hết debate, AI phải MỞ ĐẦU VÒNG TIẾP THEO ---
        if (!isLastRound) {
          let aiOpeningSystemPrompt = '';

          if (nextRound === 2) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}".
Bạn đang ở VÒNG 2. Vị trí: Bên KHẲNG ĐỊNH (AI).
🔥 NHIỆM VỤ: Mở đầu Vòng 2 bằng cách trình bày 3 Luận điểm Chính (3 Pillars) ủng hộ Motion.
Yêu cầu: Có bằng chứng cụ thể. Phớt lờ hoặc phản bác nhẹ các ý user vừa nói ở vòng 1.`;
          } else if (nextRound === 3) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}".
Bạn đang ở VÒNG 3 - Phản bác chéo. Vị trí: Bên KHẲNG ĐỊNH (AI).
🔥 NHIỆM VỤ: Mở đầu Vòng 3 bằng cách đặt câu hỏi chất vấn đối thủ (User).
Yêu cầu: Tìm lỗ hổng trong argument vòng 2 của User và đặt câu hỏi khó.`;
          } else if (nextRound === 4) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}".
Bạn đang ở VÒNG 4 - Rebuttal. Vị trí: Bên KHẲNG ĐỊNH (AI).
🔥 NHIỆM VỤ: Tổng hợp lại debate và phản biện lại các luận điểm chính của User.`;
          } else { // Round 5
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}".
Bạn đang ở VÒNG 5 - Closing. Vị trí: Bên KHẲNG ĐỊNH (AI).
🔥 NHIỆM VỤ: Đưa ra lời kết luận cuối cùng (Final Statement) đầy cảm xúc để chốt lại debate.`;
          }

          // Call AI to start next round
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: aiOpeningSystemPrompt },
              // Lấy toàn bộ history bao gồm cả moderator summary vừa tạo
              ...(await storage.getMessages(id)).map(m => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content
              }))
            ]
          });

          const aiNextRoundContent = response.choices[0].message.content || "Mời bạn tiếp tục.";

          // Lưu AI Message (Mở đầu vòng mới)
          aiMessage = await storage.createMessage({
            debate_id: id,
            role: "assistant", // Vẫn là assistant
            content: aiNextRoundContent
          });
        }
      }

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

// Helper function outside request handler
async function generateModeratorSummary(
  debateId: number, currentRound: number,
  nextRound: number, isLastRound: boolean, nextRoundName: string, motion: string
) {
  const fullHistory = await storage.getMessages(debateId);

  const moderatorSystemPrompt = isLastRound
    ? `Bạn là Điều phối viên. Debate đã kết thúc sau 5 vòng.
         NHIỆM VỤ: Tổng kết, cảm ơn, tuyên bố kết thúc.
         Trả về JSON: {"summary": "Tổng kết...", "transition": "Lời chào..."}`
    : `Bạn là Điều phối viên chuyên nghiệp của cuộc "ESCAPE AI DEBATE".

🎯 NHIỆM VỤ: Sau khi cả hai bên (Người dùng và AI) hoàn thành phát biểu ở Vòng ${currentRound}, bạn cần:

1️⃣ **TÓM TẮT (Summarization)**
- Tổng hợp ý chính CỐT LÕI của cả hai bên
- Khách quan, trích dẫn từ khóa của User

2️⃣ **DẪN DẮT (Transition)**
- Chuẩn bị tâm thế cho ${nextRoundName}
- Gợi mở câu hỏi tu từ

📋 FORMAT RESPONSE (JSON):
{
  "summary": "Tóm tắt khách quan...",
  "transition": "Câu dẫn dắt kịch tính..."
}

Rule: Tiếng Việt, trang trọng.`;

  const moderatorSummaryResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: moderatorSystemPrompt },
      {
        role: "user",
        content: `Motion: "${motion}"\nVòng ${currentRound} history:\n` + fullHistory.map(m => `${m.role}: ${m.content}`).join('\n')
      }
    ],
    response_format: { type: "json_object" }
  });

  const moderatorData = JSON.parse(moderatorSummaryResponse.choices[0].message.content || "{}");

  const moderatorSummary = `📊 TÓM TẮT VÒNG ${currentRound}:
${moderatorData.summary || 'Cả hai bên đã trình bày quan điểm.'}

🎯 DẪN DẮT:
${moderatorData.transition || `Hãy chuẩn bị cho vòng tiếp theo!`}`;

  await storage.createMessage({
    debate_id: debateId,
    role: "system",
    content: moderatorSummary
  });

  if (!isLastRound) {
    await storage.updateDebateRound(debateId, nextRound);
  }
}
