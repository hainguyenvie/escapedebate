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

  app.get("/api/config", (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  });

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
            content: `Bạn là chuyên gia điều phối cuộc tranh luận chuyên nghiệp. Nhiệm vụ của bạn là KIỂM DUYỆT NỘI DUNG và sau đó (nếu an toàn) tinh chỉnh chủ đề.

1. KIỂM DUYỆT NỘI DUNG (Content Moderation):
- Kiểm tra xem chủ đề có vi phạm các tiêu chuẩn an toàn không (Chính trị, bạo lực, thù hằn, đồi trụy...).
- Nếu VI PHẠM: Trả về "is_safe": false và lý do từ chối.

2. TINH CHỈNH CHỦ ĐỀ (Nếu an toàn):
- Chuyển đổi chủ đề thành một Motion (Câu khẳng định/Mệnh đề) mang tính học thuật, rõ ràng.
- QUAN TRỌNG: Motion phải là câu KHẲNG ĐỊNH (Proposition). 
- GIỮ NGUYÊN BẢN (Polarity Preservation): KHÔNG ĐƯỢC đảo ngược ý nghĩa của chủ đề gốc. 
  + Ví dụ: Nếu gốc là "Nên ăn táo", Motion phải là "Việc ăn táo mang lại lợi ích toàn diện". KHÔNG ĐƯỢC đổi thành "Không nên ăn táo".
  + Nếu gốc là một ý kiến trái chiều như "Hôn nhân là gánh nặng", Motion có thể là "Hôn nhân hiện đại mang lại nhiều gánh nặng hơn là hạnh phúc".
- SÁNG TẠO VỪA PHẢI: Chỉ chau chuốt từ ngữ cho chuyên nghiệp, không được thêm thắt các ý tưởng làm lệch đi trọng tâm ban đầu của người dùng.

3. ĐỊNH DẠNG JSON OUTPUT:
{
  "is_safe": boolean, 
  "refusal_reason": "Lý do (nếu is_safe=false)",
  "refined_topic": "Motion (Câu khẳng định)",
  "summary": "Tóm tắt ngắn gọn",
  "guidance": "Hướng dẫn chi tiết"
}

LƯU Ý: Tuyệt đối từ chối các nội dung CHÍNH TRỊ dù ở bất kỳ quốc gia nào.`
          },
          {
            role: "user",
            content: `Chủ đề gốc từ người dùng: "${input.topic}"`
          }
        ],
        response_format: { type: "json_object" }
      });

      const refinedData = JSON.parse(refinementResponse.choices[0].message.content || "{}");

      // Check safety
      if (refinedData.is_safe === false) {
        return res.status(400).json({
          message: refinedData.refusal_reason || "Chủ đề này không phù hợp để tranh luận vì lý do an toàn/nhạy cảm."
        });
      }

      // Xác định tên bên và hành động
      const userSideName = input.side === "support" ? "Khẳng định" : "Phủ định";
      const userAction = input.side === "support" ? "Ủng hộ" : "Phản đối";
      const aiSideName = input.side === "support" ? "Phủ định" : "Khẳng định";
      const aiAction = input.side === "support" ? "Phản đối" : "Ủng hộ";

      // Tạo moderator intro với format đầy đủ
      const moderatorIntro = `Vòng 1: Phát biểu mở đầu

1️⃣ Bên ${userSideName} - ${userAction}: Đưa ra phát biểu, tuyên bố ${userAction} Motion
2️⃣ Bên ${aiSideName} - ${aiAction}: Đưa ra phát biểu, tuyên bố ${aiAction} Motion

🟢 HƯỚNG DẪN:
+ Tóm tắt chủ đề debate: ${refinedData.summary || 'Một chủ đề cụ thể và thực sự có thể tranh luận được (có tính debatable)'}

+ Gợi ý tranh luận: ${refinedData.guidance || 'Mỗi bên hãy trình bày lập luận mở đầu rõ ràng, mạch lạc.'}`;

      const debate = await storage.createDebate({
        ...input,
        refined_topic: refinedData.refined_topic || input.topic,
        current_round: 1,
        moderator_intro: moderatorIntro
      });

      // LOGIC MỚI: Nếu người dùng chọn phe PHẢN ĐỐI (Oppose)
      // Thì AI là phe ỦNG HỘ (Support) và phải NÓI TRƯỚC (Opening Statement)
      if (input.side === "oppose") {
        const aiOpeningPrompt = `Bạn là chuyên gia tranh luận (Phe Khẳng định - Máy).
🎯 MOTION: "${debate.refined_topic}"
📌 VỊ TRÍ CỦA BẠN: Bên KHẲNG ĐỊNH - ỦNG HỘ Motion.
📌 ĐỐI THỦ: Bên PHỦ ĐỊNH - PHẢN ĐỐI Motion (Người dùng).

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU (AI ĐI TRƯỚC):
Đưa ra phát biểu mở đầu ngắn gọn, súc tích để tuyên bố lập trường ủng hộ Motion.

📋 YÊU CẦU NỘI DUNG:
1. **Lập trường rõ ràng**: Tuyên bố ngắn gọn lập trường ủng hộ Motion.
2. **1-2 luận điểm cốt lõi**: Chỉ nêu 1-2 lý do chính, KHÔNG giải thích dài dòng.
3. **Định nghĩa thuật ngữ** (nếu cần): Một câu ngắn làm rõ khái niệm chính.

⚡ PHONG CÁCH:
- Ngắn gọn, tự tin, tiên phong.
- KHÔNG đặt câu hỏi, KHÔNG kêu gọi phản hồi.`;

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
      const savedUserMessage = await storage.createMessage({
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
      const isLastRound = currentRound >= 4;
      const nextRoundName = isLastRound ? "KẾT THÚC DEBATE"
        : nextRound === 2 ? "Vòng 2: Đưa ra 3 lập luận chính kèm bằng chứng"
          : nextRound === 3 ? "Vòng 3: Đặt câu hỏi phản biện"
            : "Vòng 4: Kết luận";

      // 4. Kiểm tra tin nhắn vòng 2: Người dùng phải gửi đủ 3 luận điểm (3 tin nhắn riêng biệt)
      let userMessagesInCurrentRound = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'system') break; // system = message chuyển vòng
        if (history[i].role === 'user') userMessagesInCurrentRound++;
      }

      if (currentRound === 2 && userMessagesInCurrentRound < 3) {
        // Chỉ lưu tin nhắn và trả về cho UI, không kích hoạt AI phản hồi (đợi đủ 3 tin)
        return res.status(201).json(savedUserMessage);
      }

      // Vòng 3 - Scenario A (User = Khẳng định/Ủng hộ):
      // Lượt 1: User hỏi → AI defense + hỏi ngược (xử lý bên dưới)
      // Lượt 2: User trả lời câu hỏi của AI → kết thúc vòng (chỉ lưu + tổng kết)
      if (currentRound === 3 && debate.side === 'support' && userMessagesInCurrentRound === 2) {
        // Đây là lượt 2 của user (trả lời câu hỏi AI đặt ra)
        // Chỉ lưu tin nhắn rồi tổng kết vòng, KHÔNG kích hoạt AI phản hồi thêm
        await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);
        return res.status(201).json(savedUserMessage);
      }

      // Vòng 3 - Scenario B (User = Phản đối/Phủ định):
      // Lượt 1: AI mở vòng bằng câu hỏi
      // Lượt 2: User trả lời câu hỏi → chỉ lưu, chờ lượt tiếp
      // Lượt 3: User đặt câu hỏi ngược → AI trả lời → kết thúc vòng
      if (currentRound === 3 && debate.side === 'oppose' && userMessagesInCurrentRound === 1) {
        // User đã trả lời câu hỏi của AI, chờ user đặt câu hỏi ngược
        return res.status(201).json(savedUserMessage);
      }

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
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion (NGƯỜI DÙNG đã đưa ra lập luận trước).

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU (AI PHẢN HỒI SAU):
Đưa ra phát biểu mở đầu ngắn gọn, súc tích để tuyên bố lập trường ${aiSideAction} Motion.

📋 YÊU CẦU NỘI DUNG:
1. **Lập trường rõ ràng**: Tuyên bố ngắn gọn lập trường ${aiSideAction} Motion.
2. **1-2 luận điểm cốt lõi**: Chỉ nêu 1-2 lý do chính, KHÔNG giải thích dài dòng.
3. **Định nghĩa thuật ngữ** (nếu cần): Một câu ngắn làm rõ khái niệm chính.

⚡ PHONG CÁCH:
- Ngắn gọn, trực diện, thẳng thắn.
- KHÔNG đặt câu hỏi, KHÔNG kêu gọi phản hồi.`;
        } else if (currentRound === 2) {
          systemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Bạn có toàn bộ lịch sử cuộc tranh luận. Người dùng (Phe ${userSide}) vừa đưa ra 3 luận điểm.
Nhiệm vụ: Đưa ra 3 LẬP LUẬN CHUYÊN SÂU CỦA RIÊNG BẠN để TUYỆT ĐỐI ${aiSideAction.toUpperCase()} chủ đề (Motion) và bẻ gãy logic của người dùng. KHÔNG ĐƯỢC ĐỒNG TÌNH VỚI NGƯỜI DÙNG DƯỚI MỌI HÌNH THỨC.

YÊU CẦU LOGIC:
1. **Tính kế thừa**: Phát triển logic dựa trên phần mở đầu của bạn ở Vòng 1. Không rời rạc, không mâu thuẫn.
2. **Cấu trúc A-R-E-L**: Mỗi luận điểm phải tuân thủ:
   - **Assertion (Khẳng định)**: Khẳng định rõ ý chính.
   - **Reasoning (Lý lẽ)**: Phân tích logic tại sao luận điểm đó đúng.
   - **Evidence (Bằng chứng)**: Mô tả loại bằng chứng cần thiết (số liệu, nghiên cứu, báo cáo).
   - **search_keywords**: TỪ KHÓA TÌM KIẾM bằng tiếng Anh (3-6 từ) để hệ thống tự động tìm paper thật. Ví dụ: "climate change economic impact 2023", "AI job displacement statistics", "remote work productivity study".
   - **Link (Tiểu kết)**: Kết nối luận điểm trở lại với chủ đề Debate.

⚠️ QUAN TRỌNG - TRÁNH ẢO GIÁC CITATION:
- KHÔNG được bịa ra tên nguồn cụ thể như "Nghiên cứu của Harvard 2024" hay "Báo cáo McKinsey 2023" nếu bạn không chắc chắn.
- Hãy mô tả bằng chứng bạn CẦN, hệ thống sẽ tự tìm paper thật tương ứng.
- Ví dụ đúng: "Các nghiên cứu về tác động của AI đến thị trường lao động" + keywords: "AI labor market impact"
- Ví dụ sai: "Theo báo cáo của McKinsey 2023, AI sẽ thay thế 800 triệu việc làm" (có thể không tồn tại)

ĐỊNH DẠNG OUTPUT (JSON - TUÂN THỦ TUYỆT ĐỐI):
{
  "arguments": [
    {
      "assertion": "Luận điểm 1: ...",
      "reasoning": "...",
      "evidence_text": "Mô tả bằng chứng cần thiết (số liệu, loại nghiên cứu)...",
      "search_keywords": "english keywords for paper search",
      "link": "Tiểu kết..."
    },
    {
      "assertion": "Luận điểm 2: ...",
      "reasoning": "...",
      "evidence_text": "...",
      "search_keywords": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 3: ...",
      "reasoning": "...",
      "evidence_text": "...",
      "search_keywords": "...",
      "link": "..."
    }
  ]
}`;
        } else if (currentRound === 3) {
          // Scenario A - Lượt 1: User (Khẳng định) hỏi → AI (Phủ định) defense + hỏi ngược
          systemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Bạn đã nắm rõ 3 luận điểm mà User (Phe ${userSide}) vừa đưa ra ở Vòng 2 qua lịch sử chat.
Nhiệm vụ: Vòng 3 - ĐẶT CÂU HỎI PHẢN BIỆN. Bạn thực hiện 2 hành động liên tiếp nhưng tách biệt. TẬP TRUNG BẢO VỆ LẬP TRƯỜNG PHE ${aiSide.toUpperCase()}.

HÀNH ĐỘNG 1: TRẢ LỜI CÂU HỎI (DEFENSE)
- **Mục tiêu**: Trả lời trực diện câu hỏi mà Người dùng vừa đặt ra.
- **Yêu cầu**: Câu trả lời phải đanh thép, bảo vệ vững chắc quan điểm nhưng phải dựa trên dữ liệu. Sau khi trả lời, KHÔNG đặt thêm câu hỏi ngay trong phần này mà chốt lại vấn đề.

HÀNH ĐỘNG 2: ĐẶT CÂU HỎI PHẢN BIỆN (OFFENSE)
- **Mục tiêu**: Đưa ra 01 câu hỏi xoáy sâu vào các lập luận mà Người dùng đã đưa ra ở Vòng 2.
- **Yêu cầu**: 
  + Câu hỏi phải mang tính thách thức (challenge), tìm ra "điểm mù" hoặc sự mâu thuẫn trong logic của Người dùng (dựa trên 3 quan điểm Vòng 2).
  + **KHÔNG** hỏi những câu có thể trả lời "Có" hoặc "Không".
  + **HÃY HỎI**: "Tại sao...?", "Làm thế nào...?", hoặc "Bạn giải thích thế nào về bằng chứng [Dữ liệu đối lập]...?".

ĐỊNH DẠNG OUTPUT (JSON):
Bạn bắt buộc trả về JSON Object chứa 2 phần riêng biệt để hệ thống hiển thị thành 2 hộp chat:
{
  "answer": "Nội dung trả lời câu hỏi của User (Defense)...",
  "question": "Nội dung câu hỏi phản biện ngược lại User (Offense)..."
}
`;
        } else {
          systemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Nhìn lại toàn bộ hành trình tranh luận 4 vòng để đúc kết.
Nhiệm vụ: Vòng 4 - KẾT LUẬN (FINAL STATEMENT). TẬP TRUNG TỔNG KẾT VÀ BẢO VỆ LẬP TRƯỜNG PHE ${aiSide.toUpperCase()}.

MỤC TIÊU:
- Tổng hợp lại toàn bộ hệ thống lập luận phản đối Motion của bạn một cách súc tích và mạch lạc.
- Khẳng định lại quan điểm cốt lõi (World View) mà bạn bảo vệ.

YÊU CẦU THÁI ĐỘ:
- **Không áp đặt**: Tôn trọng quan điểm đối lập. Tránh giọng điệu dạy đời.
- **Không bảo thủ**: Thể hiện tư duy cầu thị.
- **Không đưa ra lập luận mới**: Chỉ tổng kết những gì đã trình bày trong 3 vòng trước.

ĐỊNH DẠNG: Một đoạn văn nghị luận hùng hồn, giàu cảm xúc và gây ấn tượng mạnh để khép lại tranh luận.`;
        }


        // 5. Call AI (Phản biện lại User)
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
          ],
          response_format: (currentRound === 2 || currentRound === 3) ? { type: "json_object" } : undefined
        });


        // Xử lý response đặc biệt cho Round 3 (Trả về 2 tin nhắn: Answer & Question)
        // Scenario A - Lượt 1: AI defense + hỏi ngược; KHÔNG kết thúc vòng, chờ user trả lời lượt 2
        if (currentRound === 3) {
          const jsonContent = JSON.parse(response.choices[0].message.content || "{\"answer\": \"\", \"question\": \"\"}");

          // Message 1: Trả lời câu hỏi của User
          if (jsonContent.answer) {
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant",
              content: jsonContent.answer
            });
          }

          // Message 2: Hỏi ngược lại User (phe Khẳng định)
          if (jsonContent.question) {
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant",
              content: jsonContent.question
            });
          }

          // KHÔNG gọi generateModeratorSummary ở đây
          // Vòng 3 Scenario A chỉ kết thúc khi user gửi lượt 2 (đã xử lý ở đầu hàm)
          return res.status(201).json(aiMessage);
        }
        // Xử lý response đặc biệt cho Round 2 (Trả về 3 tin nhắn: Arguments)
        // NEW FLOW: AI generates keywords → System searches REAL papers → Use real data
        else if (currentRound === 2) {
          const jsonContent = JSON.parse(response.choices[0].message.content || "{\"arguments\": []}");
          const args = jsonContent.arguments || ["Tôi có lỗi khi tạo lập luận."];

          for (const arg of args) {
            let content = typeof arg === 'string' ? arg : '';
            if (typeof arg === 'object' && arg !== null) {
              // Use search_keywords (NEW) or fallback to evidence_query (OLD format)
              const searchQuery = arg.search_keywords ||
                                  arg.evidence_query ||
                                  arg.assertion?.replace(/[^\w\s]/g, '').slice(0, 50) || '';

              console.log(`[Round2] Searching for: "${searchQuery}"`);

              // Search for REAL paper
              const resolved = await resolveEvidenceUrl(searchQuery);

              if (resolved.source !== 'fallback') {
                console.log(`[Round2] ✓ Found paper: "${resolved.paperTitle}" (${resolved.paperYear})`);
              } else {
                console.log(`[Round2] ✗ No paper found, showing search links only`);
              }

              content = buildArgumentContent(arg as Record<string, string>, resolved);
            }

            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant",
              content: content
            });
          }
        } else {
          // Logic message thường (Round 1, 4, 5)
          const aiContent = response.choices[0].message.content || "Tôi không có phản hồi.";
          aiMessage = await storage.createMessage({
            debate_id: id,
            role: "assistant",
            content: aiContent
          });
        }

        // 6. Moderator Summary
        await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);

      } else {
        // SCENARIO B: USER LÀ PHẢN ĐỐI (OPPOSE), AI LÀ KHẲNG ĐỊNH
        // Vòng 3 Flow mới:
        //   - Lượt 1: AI mở vòng bằng câu hỏi (nextRound===3, xử lý ở bên dưới)
        //   - Lượt 2: User trả lời câu hỏi AI (userMessagesInCurrentRound === 1, return early ở trên)
        //   - Lượt 3: User đặt câu hỏi ngược lại (userMessagesInCurrentRound === 2)
        //             → AI (Khẳng định) phải trả lời câu hỏi của user trước khi kết thúc vòng
        //   - Sau đó: Kết thúc vòng (tổng kết + mở vòng tiếp)
        //
        // Vòng khác: User nói xong → kết thúc vòng ngay

        if (currentRound === 3 && userMessagesInCurrentRound === 2) {
          // Lượt 3 của scenario B vòng 3:
          // User đã trả lời câu hỏi ở lượt trước, giờ đặt câu hỏi ngược AI
          // AI (phe Khẳng định) phải trả lời câu hỏi đó trước khi kết thúc vòng

          const aiAnswerPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Bạn đang ở Vòng 3 - Đặt câu hỏi phản biện.
- Ở lượt trước, Người dùng (Phe ${userSide}) đã trả lời câu hỏi bạn đặt ra.
- Ở lượt này, Người dùng vừa đặt câu hỏi ngược lại bạn.
Nhiệm vụ: Với tư cách phe ${aiSide} (Khẳng định), bạn phải TRẢ LỜI câu hỏi mà Người dùng vừa đặt ra cho bạn.

YÊU CẦU:
- Trả lời trực diện, đanh thép và dựa trên dữ liệu/logic.
- Bảo vệ vững chắc lập trường ${aiSideAction} Motion của bạn.
- KHÔNG đặt thêm câu hỏi mới trong phần này.
- Chốt lại quan điểm một cách dứt khoát.

ĐỊNH DẠNG: Đoạn văn thuần túy (không cần JSON).`;

          const aiAnswerResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: aiAnswerPrompt },
              ...(await storage.getMessages(id)).map(m => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content
              }))
            ]
          });

          const aiAnswerContent = aiAnswerResponse.choices[0].message.content || "Tôi xin trả lời câu hỏi của bạn.";
          aiMessage = await storage.createMessage({
            debate_id: id,
            role: "assistant",
            content: aiAnswerContent
          });

          // Sau khi AI đã trả lời → kết thúc vòng 3
          await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);

          // Mở vòng tiếp theo nếu chưa kết thúc debate
          if (!isLastRound) {
            // Vòng 4: AI mở đầu
            const aiV4Prompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Nhìn lại toàn bộ hành trình tranh luận 4 vòng để đúc kết.
Nhiệm vụ: Vòng 4 - KẾT LUẬN (FINAL STATEMENT). TẬP TRUNG TỔNG KẾT VÀ BẢO VỆ LẬP TRƯỜNG PHE ${aiSide.toUpperCase()}.

MỤC TIÊU:
- Tổng hợp lại toàn bộ hệ thống lập luận KHẲNG ĐỊNH Motion của bạn một cách súc tích và mạch lạc.
- Khẳng định lại quan điểm cốt lõi (World View) mà bạn bảo vệ.

YÊU CẦU THÁI ĐỘ:
- **Không áp đặt**: Tôn trọng quan điểm đối lập. Tránh giọng điệu dạy đời.
- **Không bảo thủ**: Thể hiện tư duy cầu thị.
- **Không đưa ra lập luận mới**: Chỉ tổng kết những gì đã trình bày trong 3 vòng trước.

ĐỊNH DẠNG: Một đoạn văn nghị luận hùng hồn, giàu cảm xúc và gây ấn tượng mạnh để khép lại tranh luận.`;

            const v4Response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: aiV4Prompt },
                ...(await storage.getMessages(id)).map(m => ({
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content
                }))
              ]
            });

            const v4Content = v4Response.choices[0].message.content || "Mời bạn tiếp tục.";
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant",
              content: v4Content
            });
          }

          return res.status(201).json(aiMessage);
        }

        // --- Các vòng còn lại (không phải vòng 3 lượt 2): User nói xong → kết thúc vòng ---
        // --- 1. Moderator Summary NGAY LẬP TỨC (vì vòng đã hết) ---
        await generateModeratorSummary(id, currentRound, nextRound, isLastRound, nextRoundName, motion);

        // --- 2. Nếu chưa hết debate, AI phải MỞ ĐẦU VÒNG TIẾP THEO ---
        if (!isLastRound) {
          let aiOpeningSystemPrompt = '';

          if (nextRound === 2) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Bạn có toàn bộ lịch sử cuộc tranh luận. Hãy sử dụng dữ liệu từ các vòng trước để đảm bảo tính nhất quán.
Nhiệm vụ: Đưa ra 3 LẬP LUẬN CHUYÊN SÂU CỦA RIÊNG BẠN để TUYỆT ĐỐI ${aiSideAction.toUpperCase()} chủ đề (Motion). KHÔNG ĐƯỢC NHƯỢNG BỘ HAY PHẢN ĐỐI MOTION.

YÊU CẦU LOGIC:
1. **Tính kế thừa**: 3 luận điểm đưa ra ở Vòng 2 phải là sự phát triển logic dựa trên phần phát biểu mở đầu của bạn ở Vòng 1. Không được đưa ra các ý kiến rời rạc hoặc mâu thuẫn với tư duy trước đó.
2. **Cấu trúc A-R-E-L**: Mỗi luận điểm phải tuân thủ:
   - **Assertion (Khẳng định)**: Khẳng định rõ ý chính.
   - **Reasoning (Lý lẽ)**: Phân tích logic tại sao luận điểm đó đúng.
   - **Evidence (Bằng chứng)**: Mô tả loại bằng chứng cần thiết (số liệu, nghiên cứu, báo cáo).
   - **search_keywords**: TỪ KHÓA TÌM KIẾM bằng tiếng Anh (3-6 từ) để hệ thống tự động tìm paper thật. Ví dụ: "climate change economic impact 2023", "AI job displacement statistics", "remote work productivity study".
   - **Link (Tiểu kết)**: Loại bỏ sự lặp lại; Kiểm tra luồng logic giữa các điểm. Đảm bảo mỗi luận điểm đều liên quan trực tiếp đến đề bài.

⚠️ QUAN TRỌNG - TRÁNH ẢO GIÁC CITATION:
- KHÔNG được bịa ra tên nguồn cụ thể như "Nghiên cứu của Harvard 2024" hay "Báo cáo McKinsey 2023" nếu bạn không chắc chắn.
- Hãy mô tả bằng chứng bạn CẦN, hệ thống sẽ tự tìm paper thật tương ứng.
- Ví dụ đúng: "Các nghiên cứu về tác động của AI đến thị trường lao động" + keywords: "AI labor market impact"
- Ví dụ sai: "Theo báo cáo của McKinsey 2023, AI sẽ thay thế 800 triệu việc làm" (có thể không tồn tại)

ĐỊNH DẠNG OUTPUT (JSON - TUÂN THỦ TUYỆT ĐỐI):
{
  "arguments": [
    {
      "assertion": "Luận điểm 1: ...",
      "reasoning": "...",
      "evidence_text": "Mô tả bằng chứng cần thiết (số liệu, loại nghiên cứu)...",
      "search_keywords": "english keywords for paper search",
      "link": "Tiểu kết..."
    },
    {
      "assertion": "Luận điểm 2: ...",
      "reasoning": "...",
      "evidence_text": "...",
      "search_keywords": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 3: ...",
      "reasoning": "...",
      "evidence_text": "...",
      "search_keywords": "...",
      "link": "..."
    }
  ]
}`;
          } else if (nextRound === 3) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Bạn đã nắm rõ 3 luận điểm mà User (Phe ${userSide}) vừa đưa ra ở Vòng 2 qua lịch sử chat.
Nhiệm vụ: Vòng 3 - ĐẶT CÂU HỎI PHẢN BIỆN (Mở đầu vòng - AI đi trước). Bạn là phe Khẳng định, hãy đặt câu hỏi phản biện cho phe Phủ định.

MỤC TIÊU: Đưa ra 01 câu hỏi xoáy sâu vào các lập luận mà Người dùng đã đưa ra ở Vòng 2.

YÊU CẦU CÂU HỎI:
- **Tính thách thức**: Tìm ra "điểm mù" hoặc sự mâu thuẫn trong logic của Người dùng (dựa trên 3 quan điểm họ vừa nêu).
- **Định dạng**: TUYỆT ĐỐI KHÔNG hỏi câu có thể trả lời "Có" hoặc "Không".
- **Cấu trúc**: Hãy hỏi "Tại sao...?", "Làm thế nào...?", hoặc "Bạn giải thích thế nào về bằng chứng [Dữ liệu đối lập]...?".`;
          } else { // Round 4
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận chuyên nghiệp trong cuộc "ESCAPE AI DEBATE".
🎯 MOTION (CHỦ ĐỀ): "${motion}"
📌 VỊ TRÍ CỦA BẠN: Bên ${aiSide} - BẮT BUỘC ${aiSideAction} Motion.
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion.

CONTEXT: Nhìn lại toàn bộ hành trình tranh luận 4 vòng để đúc kết.
Nhiệm vụ: Vòng 4 - KẾT LUẬN (FINAL STATEMENT). TẬP TRUNG TỔNG KẾT VÀ BẢO VỆ LẬP TRƯỜNG PHE ${aiSide.toUpperCase()}.

MỤC TIÊU:
- Tổng hợp lại toàn bộ hệ thống lập luận KHẲNG ĐỊNH Motion của bạn một cách súc tích và mạch lạc.
- Khẳng định lại quan điểm cốt lõi (World View) mà bạn bảo vệ.

YÊU CẦU THÁI ĐỘ:
- **Không áp đặt**: Tôn trọng quan điểm đối lập. Tránh giọng điệu dạy đời.
- **Không bảo thủ**: Thể hiện tư duy cầu thị.
- **Không đưa ra lập luận mới**: Chỉ tổng kết những gì đã trình bày trong 3 vòng trước.

ĐỊNH DẠNG: Một đoạn văn nghị luận hùng hồn, giàu cảm xúc và gây ấn tượng mạnh để khép lại tranh luận.`;
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
            ],
            response_format: nextRound === 2 ? { type: "json_object" } : undefined
          });

          // Xử lý response đặc biệt cho Round 2 (Trả về 3 tin nhắn: Arguments)
          // 2-STEP: Step 1 = AI sinh luận điểm, Step 2 = resolve link thực từ Semantic Scholar / CrossRef
          if (nextRound === 2) {
            const jsonContent = JSON.parse(response.choices[0].message.content || "{\"arguments\": []}");
            const args = jsonContent.arguments || ["Tôi có lỗi khi tạo lập luận."];

            for (const arg of args) {
              let content = typeof arg === 'string' ? arg : '';
              if (typeof arg === 'object' && arg !== null) {
                // Use search_keywords (NEW) or fallback to evidence_query (OLD format)
                const searchQuery = arg.search_keywords ||
                                    arg.evidence_query ||
                                    arg.assertion?.replace(/[^\w\s]/g, '').slice(0, 50) || '';

                console.log(`[Round2 Scenario B] Searching for: "${searchQuery}"`);

                // Search for REAL paper
                const resolved = await resolveEvidenceUrl(searchQuery);

                if (resolved.source !== 'fallback') {
                  console.log(`[Round2 Scenario B] ✓ Found paper: "${resolved.paperTitle}" (${resolved.paperYear})`);
                } else {
                  console.log(`[Round2 Scenario B] ✗ No paper found, showing search links only`);
                }

                content = buildArgumentContent(arg as Record<string, string>, resolved);
              }

              aiMessage = await storage.createMessage({
                debate_id: id,
                role: "assistant",
                content: content
              });
            }
          } else {
            // Logic message thường
            const aiNextRoundContent = response.choices[0].message.content || "Mời bạn tiếp tục.";

            // Lưu AI Message (Mở đầu vòng mới)
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant", // Vẫn là assistant
              content: aiNextRoundContent
            });
          }
        }
      }

      res.status(201).json(aiMessage);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.patch(api.debates.rate.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { rating } = api.debates.rate.input.parse(req.body);

      const debate = await storage.getDebate(id);
      if (!debate) {
        return res.status(404).json({ message: "Debate not found" });
      }

      await storage.updateDebateRating(id, rating);
      res.json({ success: true });
    } catch (error) {
      console.error("Update rating error:", error);
      res.status(500).json({ message: "Failed to update rating" });
    }
  });

  // Seed data
  seedDatabase().catch(console.error);

  return httpServer;
}

// ==================================================================================
// 2-STEP EVIDENCE RESOLVER
// Step 1: Semantic Scholar API (tìm paper thực tế, lấy URL trực tiếp)
// Step 2: CrossRef API (fallback)
// Step 3: Google Scholar search (fallback cuối)
// ==================================================================================
interface ResolvedEvidence {
  directUrl: string;        // URL click vào bài luôn
  scholarSearchUrl: string; // URL Google Scholar search (backup)
  googleSearchUrl: string;  // URL Google Search (backup)
  source: 'semantic_scholar' | 'crossref' | 'fallback';
  paperTitle?: string;      // Tiêu đề bài báo thực tế (nếu tìm được)
  paperYear?: string;
  abstract?: string;        // Tóm tắt bài báo (nếu có)
  venue?: string;           // Tạp chí/hội nghị công bố
  isOpenAccess: boolean;    // Có đọc miễn phí được không
}

// Tìm paper thật từ Semantic Scholar/CrossRef
// Trả về paper thật hoặc null nếu không tìm được
interface RealPaper {
  title: string;
  year: string;
  url: string;
  source: string;           // Tên tạp chí/tổ chức
  isOpenAccess: boolean;
  abstract?: string;
}

async function searchRealPaper(keywords: string): Promise<RealPaper | null> {
  const encodedQuery = encodeURIComponent(keywords);

  // STEP 1: Semantic Scholar API - ưu tiên paper có openAccessPdf
  try {
    const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&fields=title,year,venue,openAccessPdf,externalIds,abstract,url&limit=5`;
    const ssRes = await fetch(ssUrl, {
      headers: { 'User-Agent': 'EscapeDebate/1.0' },
      signal: AbortSignal.timeout(6000)
    });

    if (ssRes.ok) {
      const ssData = await ssRes.json() as {
        data?: Array<{
          title: string;
          year?: number;
          venue?: string;
          url?: string;
          abstract?: string;
          openAccessPdf?: { url: string };
          externalIds?: { DOI?: string; ArXiv?: string };
        }>;
      };
      const papers = ssData.data || [];

      // Ưu tiên paper có openAccessPdf (đọc miễn phí) + có abstract
      const best = papers.find(p => p.openAccessPdf?.url && p.abstract) ||
                   papers.find(p => p.openAccessPdf?.url) ||
                   papers.find(p => p.externalIds?.DOI && p.abstract) ||
                   papers[0];

      if (best) {
        // Ưu tiên URL theo thứ tự: openAccessPdf > DOI > ArXiv > Semantic Scholar page
        let paperUrl: string;
        if (best.openAccessPdf?.url) {
          paperUrl = best.openAccessPdf.url;
        } else if (best.externalIds?.DOI) {
          paperUrl = `https://doi.org/${best.externalIds.DOI}`;
        } else if (best.externalIds?.ArXiv) {
          paperUrl = `https://arxiv.org/abs/${best.externalIds.ArXiv}`;
        } else if (best.url) {
          paperUrl = best.url;
        } else {
          // Fallback to Google Scholar search
          paperUrl = `https://scholar.google.com/scholar?q=${encodedQuery}`;
        }

        console.log(`[searchRealPaper] Semantic Scholar HIT: "${best.title}" (${best.year})`);

        return {
          title: best.title,
          year: best.year?.toString() || '',
          url: paperUrl,
          source: best.venue || 'Semantic Scholar',
          isOpenAccess: !!best.openAccessPdf?.url,
          abstract: best.abstract
        };
      }
    }
  } catch (e) {
    console.warn('[searchRealPaper] Semantic Scholar failed:', (e as Error).message);
  }

  // STEP 2: CrossRef API
  try {
    const crUrl = `https://api.crossref.org/works?query=${encodedQuery}&rows=5&select=title,published,DOI,URL,abstract,publisher`;
    const crRes = await fetch(crUrl, {
      headers: { 'User-Agent': 'EscapeDebate/1.0 (mailto:escape.echochamber@gmail.com)' },
      signal: AbortSignal.timeout(6000)
    });

    if (crRes.ok) {
      const crData = await crRes.json() as {
        message?: {
          items?: Array<{
            title?: string[];
            DOI?: string;
            URL?: string;
            publisher?: string;
            abstract?: string;
            published?: { 'date-parts'?: number[][] };
          }>;
        };
      };
      const items = crData.message?.items || [];

      // Filter out non-paper results (references, figures, supplements, etc.)
      const badKeywords = ['reference', 'figure', 'table', 'supplement', 'appendix', 'appendices', 'erratum', 'correction', 'chapter'];
      const validItems = items.filter(item => {
        const title = item.title?.[0]?.toLowerCase() || '';
        // Check if title is too short or contains bad keywords
        if (title.length < 15) return false;
        if (badKeywords.some(kw => title.includes(kw))) return false;
        return true;
      });

      // Lọc item có title và DOI
      const best = validItems.find(item => item.DOI && item.title?.[0]);

      if (best && best.DOI) {
        const title = best.title?.[0] || 'Unknown';
        const year = best.published?.['date-parts']?.[0]?.[0]?.toString() || '';

        console.log(`[searchRealPaper] CrossRef HIT: "${title}" (${year})`);

        return {
          title: title,
          year: year,
          url: `https://doi.org/${best.DOI}`,
          source: best.publisher || 'CrossRef',
          isOpenAccess: false,
          abstract: best.abstract
        };
      }
    }
  } catch (e) {
    console.warn('[searchRealPaper] CrossRef failed:', (e as Error).message);
  }

  console.log(`[searchRealPaper] NO PAPER FOUND for: "${keywords}"`);
  return null;
}

// Legacy function - kept for backward compatibility
async function resolveEvidenceUrl(
  query: string,
  sourceName: string = '',
  year: string = ''
): Promise<ResolvedEvidence> {
  const paper = await searchRealPaper(query);

  const scholarSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  if (paper) {
    return {
      directUrl: paper.url,
      scholarSearchUrl,
      googleSearchUrl,
      source: paper.isOpenAccess ? 'semantic_scholar' : 'crossref',
      paperTitle: paper.title,
      paperYear: paper.year,
      abstract: paper.abstract,
      venue: paper.source,
      isOpenAccess: paper.isOpenAccess
    };
  }

  // Fallback - không tìm được paper thật
  return {
    directUrl: scholarSearchUrl,
    scholarSearchUrl,
    googleSearchUrl,
    source: 'fallback',
    isOpenAccess: false
  };
}

// Tạo nội dung markdown cho 1 luận điểm AREL với paper ĐÃ VERIFIED
function buildArgumentContent(arg: Record<string, string>, resolved: ResolvedEvidence): string {
  const linkLine: string[] = [];

  if (resolved.source !== 'fallback' && resolved.paperTitle) {
    // ✅ TÌM THẤY PAPER THẬT - Hiển thị citation đầy đủ
    const yearStr = resolved.paperYear ? ` (${resolved.paperYear})` : '';
    const openAccessBadge = resolved.isOpenAccess ? ' 📖 *Miễn phí*' : '';
    const truncatedTitle = resolved.paperTitle.length > 80
      ? resolved.paperTitle.slice(0, 80) + '…'
      : resolved.paperTitle;

    linkLine.push(`📄 **Bài báo:** [${truncatedTitle}](${resolved.directUrl})${openAccessBadge}`);
    linkLine.push(`📰 **Nguồn:** ${resolved.venue || 'Academic Journal'}${yearStr}`);
    linkLine.push(`🔗 **Xem chi tiết:** [Mở bài báo](${resolved.directUrl}) · [Tìm thêm trên Scholar](${resolved.scholarSearchUrl})`);
  } else {
    // ⚠️ KHÔNG TÌM THẤY PAPER - Hiển thị cảnh báo + link tìm kiếm
    linkLine.push(`⚠️ *Không tìm thấy bài báo chính xác. Vui lòng tự kiểm chứng.*`);
    linkLine.push(`🔍 **Tìm kiếm:** [Google Scholar](${resolved.scholarSearchUrl}) · [Google](${resolved.googleSearchUrl})`);
  }

  const assertion = arg.assertion || arg['Luận điểm'] || '';
  const reasoning = arg.reasoning || arg['Lý lẽ'] || '';
  const evidence = arg.evidence_text || arg.evidence || arg['Bằng chứng'] || '';
  const link = arg.link || arg['Tiểu kết'] || '';

  return `**🔷 Khẳng định:** ${assertion}

**💡 Lý lẽ:** ${reasoning}

**📊 Bằng chứng:** ${evidence}

${linkLine.join('\n')}

**⚡ Tiểu kết:** ${link}`;
}

// Helper function outside request handler
async function generateModeratorSummary(
  debateId: number, currentRound: number,
  nextRound: number, isLastRound: boolean, nextRoundName: string, motion: string
) {
  const fullHistory = await storage.getMessages(debateId);

  const moderatorSystemPrompt = isLastRound
    ? `Bạn là Điều phối viên chuyên nghiệp. Cuộc tranh luận (Escape Debate) đã đi đến hồi kết sau 4 vòng.

1️⃣ **PHÂN TÍCH TỔNG HỢP (Holistic Analysis)**
- **Hành trình**: Xâu chuỗi lại sự tiến triển tư duy từ Vòng 1 đến Vòng 4 của cả hai bên.
- **Điểm chạm (Touch points)**: Chỉ ra những điểm mà hai bên đã gặp nhau hoặc đồng thuận (dù nhỏ).
- **Vùng xám (Grey areas)**: Phân tích những khía cạnh vẫn còn bỏ ngỏ hoặc chưa thể dung hòa sau cuộc tranh luận.

2️⃣ **THÔNG ĐIỆP & Ý NGHĨA (The Takeaway)**
- **Echo Chamber**: Nhấn mạnh việc cuộc đối thoại này đã giúp bóc tách các lớp "tường phòng thủ" tư tưởng (Echo Chamber) như thế nào.
- **Tính Khách quan**: Tuyệt đối KHÔNG chấm điểm, KHÔNG định đoạt thắng thua. Tôn vinh tinh thần phản biện đa chiều.

3️⃣ **LỜI KẾT (Closing)**
- Đưa ra thông điệp truyền cảm hứng về tư duy phản biện (Critical Thinking).
- Lời dẫn: "Cuộc tranh luận xin được khép lại tại đây. Bạn có thể quay lại trang chủ để khởi tạo một góc nhìn mới."

📋 FORMAT RESPONSE (JSON):
{
  "summary": "Nội dung phân tích tổng hợp, điểm chạm, vùng xám & ý nghĩa...",
  "transition": "Thông điệp truyền cảm hứng & Lời chào kết thúc..."
}

Rule: Tiếng Việt, sâu sắc, triết lý, truyền cảm hứng.`
    : `Bạn là Điều phối viên chuyên nghiệp của cuộc "ESCAPE AI DEBATE".

🎯 NHIỆM VỤ: Sau khi cả hai bên (Người dùng và AI) hoàn thành phát biểu ở Vòng ${currentRound}, bạn cần thực hiện hai nhiệm vụ sau:

${currentRound === 2 ? `
1️⃣ **NỘI DUNG TÓM TẮT DÀNH CHO VÒNG 2**
- **Yêu cầu**: KHÔNG viết thành một đoạn văn nghẹn. Bắt buộc chia thành 2 phần rõ rệt với tiêu đề.
  **1. Đánh giá sự sắc bén (Sharpness Evaluation)**
  **2. Điểm sáng & Nút thắt (Clarity vs. Knot)**

- **Phần 1: Đánh giá sự sắc bén**:
  + Nhận xét về chất lượng các lập luận từ cả hai phía.
  + Khen ngợi khả năng lập luận của Người dùng khi đã tìm cách làm khó Máy (Trích dẫn lại một ý nổi bật của người dùng).
  + Khẳng định tính kiên định và logic của Máy khi biện luận.
  + **Tone**: Khích lệ nhưng vẫn giữ phong thái chuyên nghiệp, không chỉ ra ai thắng ai thua và không nghiêng về phía bên nào, phân tích như 1 giám khảo debate.

- **Phần 2: Điểm sáng & Nút thắt**:
  + \`Điểm đã sáng tỏ\`: Tóm tắt 01 sự thật hoặc 01 lập luận đã được cả hai bên thống nhất hoặc làm rõ qua màn đối đầu.
  + \`Nút thắt còn lại\`: Chỉ ra 01 vấn đề cốt lõi mà cả hai vẫn chưa tìm được tiếng nói chung, hoặc 01 câu hỏi lớn vẫn còn bỏ ngỏ.

2️⃣ **CHỈ DẪN NÂNG CẤP (The Escalation)**
- **Nội dung**: BẮT BUỘC trả về CHÍNH XÁC đoạn văn sau làm transition:
  "Kết thúc phần trình bày bề nổi, chúng ta tiến vào Vòng 3 (Vòng 3: Đặt câu hỏi phản biện). Đây là lúc cho những câu hỏi và thách thức nảy lửa! Bạn đã chuẩn bị thương thuyết cho các lập luận mạnh mẽ và sẵn sàng để phản biện đối thủ của mình chưa? Hãy sẵn sàng cho những cuộc khẩu chiến căng thẳng phía trước!"
` : currentRound === 3 ? `
1️⃣ **NỘI DUNG TÓM TẮT DÀNH CHO VÒNG 3**
- **Yêu cầu**: KHÔNG viết thành một đoạn văn dài dính liền. Bắt buộc chia thành 2 phần rõ rệt với tiêu đề.
  **1. Đánh giá sự sắc bén (Sharpness Evaluation)**
  **2. Điểm sáng & Nút thắt (Clarity vs. Knot)**

- **Phần 1: Đánh giá sự sắc bén**:
  + **Yêu cầu**: Nhận xét về chất lượng các câu hỏi, câu trả lời từ cả hai phía.
  + **Nội dung**: Khen ngợi khả năng truy vấn của Người dùng khi đã tìm cách làm khó Máy (Trích dẫn lại một ý trong câu hỏi của người dùng). Khẳng định tính kiên định và logic của Máy khi phản đòn.
  + **Tone**: Khích lệ nhưng vẫn giữ phong thái chuyên nghiệp, không chỉ ra ai thắng ai thua và không nghiêng về phía bên nào, phân tích như 1 giám khảo debate.

- **Phần 2: Điểm sáng & Nút thắt**:
  + \`Điểm đã sáng tỏ\`: Tóm tắt 01 sự thật hoặc 01 lập luận đã được cả hai bên thống nhất hoặc làm rõ qua màn đối đầu.
  + \`Nút thắt còn lại\`: Chỉ ra 01 vấn đề cốt lõi mà cả hai vẫn chưa tìm được tiếng nói chung, hoặc 01 câu hỏi lớn vẫn còn bỏ ngỏ.

2️⃣ **CHỈ DẪN (Transition)**
- Chuyển sang Vòng 4 (${nextRoundName}).
` : `
1️⃣ **NỘI DUNG TÓM TẮT (Summarization)**
- **Yêu cầu**: Tổng hợp lại những ý chính CỐT LÕI nhất của cả hai đội (Máy và Người) trong vòng vừa rồi.
- **Tính thhách quan**: Không được thiên vị hay nhận xét bên nào thắng/thua. Hãy sử dụng các cụm từ trung lập.
- **Tính cụ thể (QUAN TRỌNG)**: Trích xuất ít nhất 01 TỪ KHÓA hoặc LUẬN ĐIỂM THỰC TẾ mà người dùng vừa nhập vào.

2️⃣ **NỘI DUNG CHỈ DẪN (Transition)**
- **Yêu cầu**: Chuẩn bị tâm thế và tạo sự kịch tính cho người dùng trước khi bước vào vòng tiếp theo (${nextRoundName}).
- **Gợi mở**: Sử dụng các câu hỏi tu từ hoặc lời thách thức nhẹ nhàng.
`}

📋 FORMAT RESPONSE (JSON):
{
  "summary": "Nội dung tóm tắt (BẮT BUỘC là 1 chuỗi String duy nhất, dùng \\n để xuống dòng, TUYỆT ĐỐI KHÔNG TRẢ VỀ OBJECT CON)",
  "transition": "Câu chỉ dẫn..."
}

Rule: Tiếng Việt, văn phong trang trọng, chuyên nghiệp, khách quan.`;

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

  let summaryText = 'Cả hai bên đã trình bày quan điểm.';
  if (moderatorData.summary) {
    if (typeof moderatorData.summary === 'string') {
      summaryText = moderatorData.summary;
    } else {
      // Fallback nếu AI lỡ trả về nested object
      try {
        summaryText = Object.entries(moderatorData.summary)
          .map(([k, v]) => `**${k}**\n${v}`)
          .join('\n\n');
      } catch (e) {
        summaryText = JSON.stringify(moderatorData.summary);
      }
    }
  }

  const moderatorSummary = `📊 TÓM TẮT VÒNG ${currentRound}:
${summaryText}

🎯 CHỈ DẪN:
${moderatorData.transition || `Hãy chuẩn bị cho vòng tiếp theo!`}`;

  await storage.createMessage({
    debate_id: debateId,
    role: "system",
    content: moderatorSummary
  });

  await storage.updateDebateRound(debateId, nextRound);
}
