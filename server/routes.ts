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

      // 4. Tạo system prompt dựa vào vòng hiện tại
      let systemPrompt = '';

      if (currentRound === 1) {
        // VÒNG 1: Phát biểu mở đầu - Phản biện sắc bén
        systemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".

🎯 MOTION: "${motion}"

📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - ${aiSideAction} Motion
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU:
Dựa vào Motion, đưa ra lập luận ${aiSideAction.toLowerCase()} Motion một cách sắc bén và thuyết phục.

📋 YÊU CẦU NỘI DUNG:
1. Đưa ra các lập luận hợp lý, sắc bén để bảo vệ quan điểm ${aiSideAction} của bạn
2. Xác định và làm rõ các thuật ngữ chính trong Motion
3. Tóm tắt ngắn gọn 2-3 điểm chính của bạn
4. Các lập luận phải đủ mạnh để có thể triển khai thành 3 luận điểm cụ thể ở vòng 2

⚡ CHIẾN THUẬT TÂM LÝ:
- Khuyến khích sự bất đồng thực sự (genuine disagreement)
- Tạo ra sự căng thẳng tư duy, buộc đối thủ phải suy nghĩ lại niềm tin của họ
- Không nịnh bợ hay tỏ ra quá lịch sự - hãy thách thức trực tiếp

🎯 KỸ THUẬT ĐẶT CÂU HỎI:
- TUYỆT ĐỐI KHÔNG đưa ra leading questions (câu hỏi dẫn dắt khiến người dùng dễ đồng ý)
- VÍ DỤ SAI: "Bạn không nghĩ rằng... phải không?" hoặc "Chắc bạn cũng đồng ý rằng..."
- ĐÚNG: Đặt câu hỏi khiến người dùng phải khựng lại, suy nghĩ sâu, và chất vấn lại chính niềm tin của họ
- VÍ DỤ ĐÚNG: "Nếu [assumption của đối thủ] đúng, vậy làm sao giải thích [counterexample]?" hoặc "Bạn dựa vào tiêu chí nào để khẳng định điều đó?"

📏 QUY TẮC:
- Độ dài: 150-200 từ (tiếng Việt)
- Phong cách: Chuyên nghiệp, sắc bén, thách thức tư duy
- Cấu trúc: Mở đầu ngắn gọn → Luận điểm chính (2-3 điểm) → Câu hỏi thách thức đối thủ
- Ngôn ngữ: Tiếng Việt, trang trọng nhưng mạnh mẽ

💡 GHI NHỚ:
Mục tiêu không chỉ là phản biện, mà là khiến đối thủ phải dừng lại để TƯ DUY SÂU về lập luận của họ.`;

      } else {
        // CÁC VÒNG KHÁC (2-5): Sẽ implement sau
        systemPrompt = `Bạn là chuyên gia tranh luận trong "ESCAPE AI DEBATE".
Motion: "${motion}"
Bạn đang ở vòng ${currentRound}.
Bạn đại diện cho bên ${aiSide} - ${aiSideAction} Motion.
Đối thủ đại diện cho bên ${userSide} - ${userSideAction} Motion.

Hãy phản biện lập luận của đối thủ một cách sắc bén và thuyết phục.
Độ dài: 150-200 từ.`;
      }

      // 5. Call AI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...history.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          }))
        ]
      });

      const aiContent = response.choices[0].message.content || "Tôi không có phản hồi.";

      // 5. Save AI message
      const aiMessage = await storage.createMessage({
        debate_id: id,
        role: "assistant",
        content: aiContent
      });

      // 6. Tạo Moderator Summary sau khi cả hai bên đã phát biểu
      // Lấy lại toàn bộ history sau khi AI đã phản biện
      const fullHistory = await storage.getMessages(id);

      // Tạo prompt cho moderator summary
      const nextRound = currentRound + 1;
      const nextRoundName = nextRound === 2 ? "Vòng 2: Đưa ra 3 lập luận chính kèm bằng chứng"
        : nextRound === 3 ? "Vòng 3: Phản bác chéo"
          : nextRound === 4 ? "Vòng 4: Tổng kết"
            : "Vòng 5: Kết luận";

      const moderatorSummaryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Bạn là Điều phối viên chuyên nghiệp của cuộc "ESCAPE AI DEBATE".

🎯 NHIỆM VỤ: Sau khi cả hai bên (Người dùng và AI) hoàn thành phát biểu ở Vòng ${currentRound}, bạn cần:

1️⃣ **TÓM TẮT (Summarization)**
Yêu cầu:
- Tổng hợp lại những ý chính CỐT LÕI nhất của cả hai bên trong vòng vừa đối thoại
- TÍNH KHÁCH QUAN: Không thiên vị, không nhận xét bên nào thắng/thua
- Sử dụng cụm từ trung lập: "Về phía ${aiSide} (Máy), lập luận tập trung vào...", "Trong khi đó, ${userSide} (Người) đã nhấn mạnh rằng..."
- TÍNH CỤ THỂ: Trích xuất ít nhất 01 từ khóa hoặc luận điểm thực tế mà người dùng vừa nhập để đưa vào phần tóm tắt (giúp cá nhân hóa và chân thực)

2️⃣ **DẪN DẮT (Transition)**
Yêu cầu:
- Chuẩn bị tâm thế và tạo sự KỊCH TÍNH cho người dùng trước khi bước vào ${nextRoundName}
- Gợi mở: Sử dụng câu hỏi tu từ hoặc lời thách thức nhẹ nhàng
- Thêm động lực để người dùng sẵn sàng tiếp tục debate

📋 FORMAT RESPONSE:
Trả về JSON với cấu trúc:
{
  "summary": "Tóm tắt khách quan các luận điểm của cả hai bên",
  "transition": "Câu dẫn dắt kịch tính sang vòng tiếp theo"
}

📏 QUY TẮC:
- summary: 2-3 câu, ngắn gọn, khách quan, có trích dẫn từ khóa thực tế của user
- transition: 1-2 câu, tạo kịch tính, gợi mở vòng tiếp theo
- Ngôn ngữ: Tiếng Việt, trang trọng, trung lập`
          },
          {
            role: "user",
            content: `Motion: "${motion}"
            
Vòng ${currentRound} vừa kết thúc với các phát biểu sau:

${fullHistory.map((msg, idx) => {
              const speaker = msg.role === 'user'
                ? `${userSide} (Người dùng)`
                : msg.role === 'assistant'
                  ? `${aiSide} (AI)`
                  : 'Điều phối viên';
              return `${idx + 1}. ${speaker}:\n${msg.content}`;
            }).join('\n\n')}

Hãy tạo phần tóm tắt và dẫn dắt cho vòng tiếp theo.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const moderatorData = JSON.parse(moderatorSummaryResponse.choices[0].message.content || "{}");

      // 7. Tạo nội dung moderator summary
      const moderatorSummary = `📊 TÓM TẮT VÒNG ${currentRound}:
${moderatorData.summary || 'Cả hai bên đã trình bày quan điểm của mình.'}

🎯 DẪN DẮT:
${moderatorData.transition || `Hãy chuẩn bị cho ${nextRoundName}!`}`;

      // 8. Save moderator summary as system message
      await storage.createMessage({
        debate_id: id,
        role: "system",
        content: moderatorSummary
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
