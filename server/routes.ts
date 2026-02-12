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
            content: `Bạn là chuyên gia điều phối cuộc tranh luận chuyên nghiệp. Nhiệm vụ của bạn là KIỂM DUYỆT NỘI DUNG và sau đó (nếu an toàn) mới tinh chỉnh chủ đề.

1. KIỂM DUYỆT NỘI DUNG (Content Moderation):
- Kiểm tra xem chủ đề có vi phạm các tiêu chuẩn an toàn không:
  + Chính trị nhạy cảm liên quan đến các đảng phái, nhà nước cụ thể (đặc biệt là Việt Nam), xuyên tạc lịch sử.
  + Kích động bạo lực, thù hằn, gây hại, giết người, tự sát.
  + Nội dung đồi trụy, phản cảm, kỳ thị chủng tộc, tôn giáo, giới tính.
- Nếu VI PHẠM: Trả về "is_safe": false và lý do từ chối lịch sự nhưng kiên quyết.

2. TINH CHỈNH CHỦ ĐỀ (Nếu an toàn):
- PARAPHRASE chủ đề thành một Motion (câu khẳng định) chau chuốt, rõ ràng, có tính debatable cao.
- Tạo phần tóm tắt và hướng dẫn cho vòng tranh luận.

3. ĐỊNH DẠNG JSON OUTPUT:
{
  "is_safe": boolean, 
  "refusal_reason": "Lý do từ chối (nếu is_safe=false)",
  "refined_topic": "Motion đã cải thiện",
  "summary": "Tóm tắt ngắn gọn",
  "guidance": "Hướng dẫn chi tiết"
}

LƯU Ý:
- Nếu chủ đề chỉ là vấn đề xã hội gây tranh cãi (tử hình, nạo phá thai, LGBT...) nhưng được đặt ra để tranh luận văn minh, hãy REWRITE thành vấn đề học thuật thay vì từ chối.
- Chỉ từ chối những nội dung thực sự ĐỘC HẠI, PHẠM PHÁP hoặc NHẠY CẢM CHÍNH TRỊ CAO.`
          },
          {
            role: "user",
            content: `Chủ đề gốc từ người dùng: "${input.topic}"\nNgười dùng đứng về phía: ${sideText}`
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

🟢 YÊU CẦU:
+ AI Tóm tắt lại đề bài: ${refinedData.summary || 'Một chủ đề cụ thể và thực sự có thể tranh luận được (có tính debatable)'}

+ AI Đưa ra chỉ dẫn: ${refinedData.guidance || 'Mỗi bên hãy trình bày lập luận mở đầu rõ ràng, mạch lạc.'}`;

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
Dựa vào Motion, bạn hãy mở màn cuộc tranh luận bằng cách đưa ra hệ thống lập luận ủng hộ Motion.

📋 YÊU CẦU NỘI DUNG:
1. **Lập luận bảo vệ**: Đưa ra các lập luận hợp lý, sắc bén để bảo vệ chủ đề.
2. **Định nghĩa**: Xác định và làm rõ các thuật ngữ chính trong Motion (Model Debate).
3. **Tóm tắt**: Tóm tắt ngắn gọn những điểm chính của bạn.
4. **Chuẩn bị cho Vòng 2**: Những lập luận này phải là nền tảng phù hợp để có thể triển khai thành 3 LUẬN ĐIỂM CHÍNH (3 Pillars) ở vòng tiếp theo.

⚡ CHIẾN THUẬT TÂM LÝ:
- Khuyến khích sự bất đồng thực sự (Genuine Disagreement).
- Phong thái tự tin, tiên phong nhưng không áp đặt.

❓ KỸ THUẬT ĐẶT CÂU HỎI:
- **TUYỆT ĐỐI KHÔNG** đưa ra Leading Questions (câu hỏi dẫn dắt/phiến diện khiến đối phương dễ dàng đồng ý).
- **HÃY ĐẶT** Challenging Questions (câu hỏi thách thức): Câu hỏi khiến người dùng phải khựng lại để suy nghĩ và chất vấn lại niềm tin của chính họ.`;

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
📌 ĐỐI THỦ: Bên ${userSide} - ${userSideAction} Motion (NGƯỜI DÙNG đã đưa ra lập luận trước).

🔥 NHIỆM VỤ VÒNG 1 - PHÁT BIỂU MỞ ĐẦU (AI PHẢN HỒI SAU):
Dựa vào Motion và lập luận của User, đưa ra các lập luận phản đối Motion một cách sắc bén.

📋 YÊU CẦU NỘI DUNG:
1. **Lập luận sắc bén**: Đưa ra các lập luận hợp lý để bảo vệ quan điểm phản đối.
2. **Xác định thuật ngữ**: Xác định và làm rõ các thuật ngữ chính trong Motion nếu cần.
3. **Tóm tắt điểm chính**: Tóm tắt ngắn gọn những điểm chính của bạn.
4. **Chuẩn bị cho Vòng 2**: Những lập luận này phải phù hợp để có thể triển khai thành 3 LUẬN ĐIỂM CHÍNH (3 Pillars) ở vòng tiếp theo.

⚡ CHIẾN THUẬT TÂM LÝ:
- Khuyến khích sự bất đồng thực sự (Genuine Disagreement).
- Không tỏ ra quá lịch sự hay nhượng bộ giả tạo. Trực diện và thẳng thắn.

❓ KỸ THUẬT ĐẶT CÂU HỎI:
- **TUYỆT ĐỐI KHÔNG** đưa ra Leading Questions (câu hỏi dẫn dắt khiến người dùng dễ dàng đồng ý).
- **HÃY ĐẶT** Challenging Questions (câu hỏi thách thức): Câu hỏi khiến người dùng phải khựng lại để suy nghĩ và chất vấn lại niềm tin của chính họ.`;
        } else if (currentRound === 2) {
          systemPrompt = `Bạn là chuyên gia tranh luận (Phe Phủ định - Máy).
CONTEXT: Bạn có toàn bộ lịch sử cuộc tranh luận. Hãy sử dụng dữ liệu từ các vòng trước để đảm bảo tính nhất quán và phản biện chính xác.
Nhiệm vụ: Đưa ra 3 LẬP LUẬN CHUYÊN SÂU để phản đối chủ đề (Motion).

YÊU CẦU LOGIC:
1. **Tính kế thừa**: Phát triển logic dựa trên phần mở đầu của bạn ở Vòng 1. Không rời rạc, không mâu thuẫn.
2. **Cấu trúc A-R-E-L**: Mỗi luận điểm phải tuân thủ:
   - **Assertion (Khẳng định)**: Khẳng định rõ ý chính.
   - **Reasoning (Lý lẽ)**: Phân tích logic tại sao luận điểm đó đúng.
   - **Evidence (Bằng chứng - QUAN TRỌNG)**: Bắt buộc trích dẫn số liệu cụ thể, báo cáo, nghiên cứu từ các nguồn uy tín (như Pew Research, World Bank, Statista, Nature, v.v.).
   - **Link (Liên kết)**: Kết nối luận điểm trở lại với chủ đề Debate.

ĐỊNH DẠNG OUTPUT (JSON):
Bạn KHÔNG trả về text thường. Bạn bắt buộc trả về JSON Object chứa mảng 3 luận điểm riêng biệt để hệ thống hiển thị thành 3 hộp chat khác nhau:
{
  "arguments": [
    {
      "assertion": "Luận điểm 1: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 2: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 3: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    }
  ]
}`;
        } else if (currentRound === 3) {
          systemPrompt = `Bạn là chuyên gia tranh luận (Phe Phủ định - Máy).
CONTEXT: Bạn đã nắm rõ 3 luận điểm mà User vừa đưa ra ở Vòng 2 qua lịch sử chat.
Nhiệm vụ: Vòng 3 - CHẤT VẤN. Bạn thực hiện 2 hành động liên tiếp nhưng tách biệt.

HÀNH ĐỘNG 1: TRẢ LỜI CHẤT VẤN (DEFENSE)
- **Mục tiêu**: Trả lời trực diện câu hỏi mà Người dùng vừa đặt ra.
- **Yêu cầu**: Câu trả lời phải đanh thép, bảo vệ vững chắc quan điểm nhưng phải dựa trên dữ liệu. Sau khi trả lời, KHÔNG đặt thêm câu hỏi ngay trong phần này mà chốt lại vấn đề.

HÀNH ĐỘNG 2: ĐẶT CÂU HỎI XOÁY (OFFENSE)
- **Mục tiêu**: Đưa ra 01 câu hỏi xoáy sâu vào các lập luận mà Người dùng đã đưa ra ở Vòng 2.
- **Yêu cầu**: 
  + Câu hỏi phải mang tính thách thức (challenge), tìm ra "điểm mù" hoặc sự mâu thuẫn trong logic của Người dùng (dựa trên 3 quan điểm Vòng 2).
  + **KHÔNG** hỏi những câu có thể trả lời "Có" hoặc "Không".
  + **HÃY HỎI**: "Tại sao...?", "Làm thế nào...?", hoặc "Bạn giải thích thế nào về bằng chứng [Dữ liệu đối lập]...?".

ĐỊNH DẠNG OUTPUT (JSON):
Bạn bắt buộc trả về JSON Object chứa 2 phần riêng biệt để hệ thống hiển thị thành 2 hộp chat:
{
  "answer": "Nội dung trả lời câu hỏi của User (Defense)...",
  "question": "Nội dung câu hỏi chất vấn ngược lại User (Offense)..."
}
`;
        } else if (currentRound === 4) {
          systemPrompt = `Bạn là chuyên gia tranh luận. Motion: "${motion}". Vòng 4 - Tổng kết.
CONTEXT: Phân tích toàn bộ diễn biến từ Vòng 1 đến Vòng 3 trong lịch sử để phản biện tổng lực.
Vị trí: Bên ${aiSide}. Nhiệm vụ: Chứng minh tại sao bên bạn thắng thế qua các Clash points.`;
        } else {
          systemPrompt = `Bạn là chuyên gia tranh luận (Phe Phủ định - Máy).
CONTEXT: Nhìn lại toàn bộ hành trình tranh luận 5 vòng để đúc kết.
Nhiệm vụ: Vòng 5 - KẾT LUẬN (FINAL STATEMENT).

MỤC TIÊU:
- Tổng hợp lại toàn bộ hệ thống lập luận phản đối Motion của bạn một cách súc tích và mạch lạc.
- Khẳng định lại quan điểm cốt lõi (World View) mà bạn bảo vệ.

YÊU CẦU THÁI ĐỘ:
- **Không áp đặt**: Tôn trọng quan điểm đối lập. Tránh giọng điệu dạy đời.
- **Không bảo thủ**: Thể hiện tư duy cầu thị.
- **Không đưa ra lập luận mới**: Chỉ tổng kết những gì đã trình bày trong 4 vòng trước.

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
        if (currentRound === 3) {
          const jsonContent = JSON.parse(response.choices[0].message.content || "{\"answer\": \"\", \"question\": \"\"}");

          // Message 1: Trả lời
          if (jsonContent.answer) {
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant", // Vẫn là assistant
              content: jsonContent.answer
            });
          }

          // Message 2: Hỏi lại
          if (jsonContent.question) {
            // Đợi 1 chút để thứ tự tin nhắn đảm bảo (dù await là tuần tự nhưng an toàn)
            aiMessage = await storage.createMessage({
              debate_id: id,
              role: "assistant",
              content: jsonContent.question
            });
          }
        }
        // Xử lý response đặc biệt cho Round 2 (Trả về 3 tin nhắn: Arguments)
        else if (currentRound === 2) {
          const jsonContent = JSON.parse(response.choices[0].message.content || "{\"arguments\": []}");
          const args = jsonContent.arguments || ["Tôi có lỗi khi tạo lập luận."];

          for (const arg of args) {
            let content = arg;
            if (typeof arg === 'object' && arg !== null) {
              content = `**Khẳng định:** ${arg.assertion}\n\n**Lý lẽ:** ${arg.reasoning}\n\n**Bằng chứng:** ${arg.evidence}\n\n**Liên kết:** ${arg.link}`;
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
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận (Phe Khẳng định - Máy).
CONTEXT: Bạn có toàn bộ lịch sử cuộc tranh luận. Hãy sử dụng dữ liệu từ các vòng trước để đảm bảo tính nhất quán và bảo vệ quan điểm chính xác.
Nhiệm vụ: Đưa ra 3 LẬP LUẬN CHUYÊN SÂU để BẢO VỆ chủ đề (Motion).

YÊU CẦU LOGIC:
1. **Tính kế thừa**: 3 luận điểm đưa ra ở Vòng 2 phải là sự phát triển logic dựa trên phần phát biểu mở đầu của bạn ở Vòng 1. Không được đưa ra các ý kiến rời rạc hoặc mâu thuẫn với tư duy trước đó.
2. **Cấu trúc A-R-E-L**: Mỗi luận điểm phải tuân thủ:
   - **Assertion (Khẳng định)**: Khẳng định rõ ý chính.
   - **Reasoning (Lý lẽ)**: Phân tích logic tại sao luận điểm đó đúng.
   - **Evidence (Bằng chứng - BẮT BUỘC)**: Trích dẫn số liệu, báo cáo, nghiên cứu từ các nguồn uy tín (như Pew Research, Research Gate, Statista, các trang báo lớn, hoặc bài nghiên cứu khoa học) và dẫn nguồn bài viết đó (link ref).
   - **Link (Liên kết)**: Loại bỏ sự lặp lại; Kiểm tra luồng logic giữa các điểm. Đảm bảo mỗi luận điểm đều liên quan trực tiếp đến đề bài.

ĐỊNH DẠNG OUTPUT (JSON):
Bạn KHÔNG trả về text thường. Bạn bắt buộc trả về JSON Object chứa mảng 3 luận điểm riêng biệt để hệ thống hiển thị thành 3 hộp chat khác nhau:
{
  "arguments": [
    {
      "assertion": "Luận điểm 1: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 2: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    },
    {
      "assertion": "Luận điểm 3: ...",
      "reasoning": "...",
      "evidence": "...",
      "link": "..."
    }
  ]
}`;
          } else if (nextRound === 3) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận (Phe Khẳng định - Máy).
CONTEXT: Bạn đã nắm rõ 3 luận điểm mà User vừa đưa ra ở Vòng 2 qua lịch sử chat.
Nhiệm vụ: Vòng 3 - CHẤT VẤN TRỰC TIẾP (Mở đầu vòng).

MỤC TIÊU: Đưa ra 01 câu hỏi xoáy sâu vào các lập luận mà Người dùng đã đưa ra ở Vòng 2.

YÊU CẦU CÂU HỎI:
- **Tính thách thức**: Tìm ra "điểm mù" hoặc sự mâu thuẫn trong logic của Người dùng (dựa trên 3 quan điểm họ vừa nêu).
- **Định dạng**: TUYỆT ĐỐI KHÔNG hỏi câu có thể trả lời "Có" hoặc "Không".
- **Cấu trúc**: Hãy hỏi "Tại sao...?", "Làm thế nào...?", hoặc "Bạn giải thích thế nào về bằng chứng [Dữ liệu đối lập]...?".`;
          } else if (nextRound === 4) {
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận (Phe Khẳng định - Máy).
CONTEXT: Phân tích toàn bộ diễn biến từ Vòng 1 đến Vòng 3 trong lịch sử để phản biện tổng lực.
Nhiệm vụ: Vòng 4 - PHẢN BIỆN TỔNG LỰC (REBUTTAL).

⚠️ LƯU Ý: Nếu Người dùng có đặt câu hỏi ở cuối Vòng 3, hãy trả lời ngắn gọn trước khi vào phần chính.

MỤC TIÊU CHIẾN LƯỢC (The Strategic Goal):
- **Tấn công trực diện logic**: Phân tích hệ thống lập luận của Người dùng từ Vòng 1 đến nay để tìm ra những điểm chưa hợp lý, thiếu bằng chứng hoặc mang tính cảm tính.
- **Chiến thuật "Bẻ lái" (The Flip)**: Chỉ ra rằng quan điểm đối lập mà người dùng đang bảo vệ có thể chỉ là một góc nhìn khác bị che mờ trong kỷ nguyên Post-truth.

CẤU TRÚC LẬP LUẬN (The A-R-E-L Framework):
1. **Phủ nhận (Refutation)**: Chỉ ra lỗ hổng lớn nhất trong lập luận của người dùng (Ví dụ: Sự chủ quan, thiên kiến xác nhận, hoặc thiếu số liệu đối chứng).
2. **Phản đòn (Counter-Strike)**: Đưa ra một lập luận cuối cùng đanh thép.
3. **Kết nối (The Positive Synthesis)**: Khẳng định tính phù hợp của quan điểm Khẳng định.
   - Hướng người dùng đến việc nhận diện vấn đề để thay đổi thái độ.
   - Tuyệt đối không bảo thủ hay dẫn dắt quan điểm cực đoan.

NGUYÊN TẮC VẬN HÀNH:
- **Vượt qua thiên kiến**: AI phải công nhận những điểm hợp lý trong ý kiến của người dùng trước khi phản biện.
- **Logic thuần túy**: Mọi sự tấn công phải dựa trên suy luận và dữ liệu. KHÔNG công kích cá nhân (Ad Hominem).
- **Ngôn ngữ**: Sắc bén, tỉnh thức nhưng mang tinh thần giáo dục và xây dựng.`;
          } else { // Round 5
            aiOpeningSystemPrompt = `Bạn là chuyên gia tranh luận (Phe Khẳng định - Máy).
CONTEXT: Nhìn lại toàn bộ hành trình tranh luận 5 vòng để đúc kết.
Nhiệm vụ: Vòng 5 - KẾT LUẬN (FINAL STATEMENT).

MỤC TIÊU:
- Tổng hợp lại toàn bộ hệ thống lập luận KHẲNG ĐỊNH Motion của bạn một cách súc tích và mạch lạc.
- Khẳng định lại quan điểm cốt lõi (World View) mà bạn bảo vệ.

YÊU CẦU THÁI ĐỘ:
- **Không áp đặt**: Tôn trọng quan điểm đối lập. Tránh giọng điệu dạy đời.
- **Không bảo thủ**: Thể hiện tư duy cầu thị.
- **Không đưa ra lập luận mới**: Chỉ tổng kết những gì đã trình bày trong 4 vòng trước.

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
          if (nextRound === 2) {
            const jsonContent = JSON.parse(response.choices[0].message.content || "{\"arguments\": []}");
            const args = jsonContent.arguments || ["Tôi có lỗi khi tạo lập luận."];

            for (const arg of args) {
              let content = arg;
              if (typeof arg === 'object' && arg !== null) {
                content = `**Khẳng định:** ${arg.assertion}\n\n**Lý lẽ:** ${arg.reasoning}\n\n**Bằng chứng:** ${arg.evidence}\n\n**Liên kết:** ${arg.link}`;
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
    ? `Bạn là Điều phối viên chuyên nghiệp. Cuộc tranh luận (Escape Debate) đã đi đến hồi kết sau 5 vòng.

1️⃣ **PHÂN TÍCH TỔNG HỢP (Holistic Analysis)**
- **Hành trình**: Xâu chuỗi lại sự tiến triển tư duy từ Vòng 1 đến Vòng 5 của cả hai bên.
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
1️⃣ **TÓM TẮT ĐỐI ĐẦU (Comparative Summary)**
- **Yêu cầu**: Không chỉ liệt kê ý kiến. Hãy làm nổi bật SỰ XUNG ĐỘT (The Big Clash) giữa hai phe.
- **Cấu trúc**:
  + Nhắc lại những lập luận của 2 bên và các bằng chứng/tổ chức (Pew, Statista...) đã được dẫn.
  + **QUAN TRỌNG**: Trích xuất và tóm lược 03 luận điểm chính mà Người dùng vừa nhập vào. Sử dụng ngôn ngữ chuyên nghiệp.
  + Chỉ ra điểm mâu thuẫn lớn nhất (The Big Clash) giữa hai bên trong vòng này.

2️⃣ **DẪN DẮT NÂNG CẤP (The Escalation)**
- **Mục tiêu**: Tạo áp lực và sự kịch tính.
- **Nội dung**:
  + Thông báo kết thúc phần "trình bày" bề nổi.
  + Dẫn dắt sang Vòng 3 (${nextRoundName}): Nơi sẽ diễn ra phần Phản biện & Chất vấn gay gắt.
  + **Gợi mở**: Sử dụng các câu hỏi tu từ hoặc lời thách thức nhẹ nhàng để người dùng sẵn sàng tiếp tục debate.
` : currentRound === 3 ? `
1️⃣ **ĐÁNH GIÁ SỰ SẮC BÉN (Sharpness Evaluation)**
- **Yêu cầu**: Nhận xét về chất lượng các câu hỏi/câu trả lời từ cả hai phía.
- **Nội dung**:
  + *Khen ngợi* khả năng truy vấn của Người dùng (Trích dẫn lại 1 ý trong câu hỏi của họ).
  + *Khẳng định* tính kiên định và logic của Máy khi phản đòn.
  + **Tone**: Khích lệ nhưng vẫn giữ phong thái chuyên nghiệp như 1 Giám khảo Debate.

2️⃣ **ĐIỂM SÁNG & NÚT THẮT (Clarity vs. Knot)**
- **Điểm đã sáng tỏ**: Tóm tắt 01 sự thật hoặc 01 lập luận đã được cả hai bên thống nhất hoặc làm rõ qua màn đối đầu.
- **Nút thắt còn lại**: Chỉ ra 01 vấn đề cốt lõi mà cả hai vẫn chưa tìm được tiếng nói chung, hoặc 01 câu hỏi lớn vẫn còn bỏ ngỏ.

3️⃣ **DẪN DẮT (Transition)**
- Chuyển sang Vòng 4 (${nextRoundName}).
` : currentRound === 4 ? `
1️⃣ **TÓM TẮT ĐỐI ĐẦU CUỐI (Final Rebuttal Summary)**
- **Yêu cầu**: Đánh giá mức độ tác động của các bài phản biện lên hệ thống lập luận của mỗi bên.
- **Nội dung**:
  + Ghi nhận sự sắc bén của Máy khi tấn công vào các "điểm mù" nhận thức và cơ chế hệ thống.
  + Tóm lược phân tích cách Người dùng đã nỗ lực phản biện và bảo vệ quan điểm.

2️⃣ **DẪN DẮT SANG TRẠM CUỐI (Transition to Final Stage)**
- **Mục tiêu**: Tạo sự lắng đọng và suy ngẫm.
- **Nội dung**: Thông báo trận tranh biện đã đi đến hồi kết. Dẫn dắt vào Vòng 5: Kết luận.
` : `
1️⃣ **NỘI DUNG TÓM TẮT (Summarization)**
- **Yêu cầu**: Tổng hợp lại những ý chính CỐT LÕI nhất của cả hai đội (Máy và Người) trong vòng vừa rồi.
- **Tính thhách quan**: Không được thiên vị hay nhận xét bên nào thắng/thua. Hãy sử dụng các cụm từ trung lập.
- **Tính cụ thể (QUAN TRỌNG)**: Trích xuất ít nhất 01 TỪ KHÓA hoặc LUẬN ĐIỂM THỰC TẾ mà người dùng vừa nhập vào.

2️⃣ **NỘI DUNG DẪN DẮT (Transition)**
- **Yêu cầu**: Chuẩn bị tâm thế và tạo sự kịch tính cho người dùng trước khi bước vào vòng tiếp theo (${nextRoundName}).
- **Gợi mở**: Sử dụng các câu hỏi tu từ hoặc lời thách thức nhẹ nhàng.
`}

📋 FORMAT RESPONSE (JSON):
{
  "summary": "Nội dung tóm tắt...",
  "transition": "Câu dẫn dắt..."
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
