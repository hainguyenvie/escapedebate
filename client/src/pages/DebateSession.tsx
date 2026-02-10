import { useEffect, useRef, useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useDebate, useSendMessage } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, History, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function DebateSession() {
  const [, params] = useRoute("/debate/:id");
  const debateId = params ? parseInt(params.id) : 0;

  const { data, isLoading } = useDebate(debateId);
  const sendMessage = useSendMessage();

  const [input, setInput] = useState("");
  // activeRound: Vòng thực tế đang diễn ra (từ database)
  // selectedRound: Vòng mà người dùng đang chọn xem trên UI
  const [selectedRound, setSelectedRound] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { debate, messages } = data || {};
  const activeRound = debate?.current_round || 1;
  const isDebateEnded = activeRound > 5;

  // Chỉ set selectedRound lần đầu tiên khi data load xong
  // Để tránh việc đang đọc mà bị nhảy tab
  useEffect(() => {
    if (activeRound && selectedRound === 1 && !data?.messages?.length) {
      // Chỉ auto-set nếu chưa có tin nhắn nào (mới vào có thể load lại trang)
      // Hoặc logic đơn giản hơn: Chỉ set lần đầu mount component
    }
  }, []);

  // Use a ref to track if we've initialized the round
  const hasInitializedRound = useRef(false);

  useEffect(() => {
    if (activeRound && !hasInitializedRound.current) {
      setSelectedRound(activeRound > 5 ? 5 : activeRound);
      hasInitializedRound.current = true;
    }
  }, [activeRound]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRound]);

  // Logic nhóm tin nhắn theo từng vòng
  const messagesByRound = useMemo(() => {
    if (!messages) return {};
    const grouped: Record<number, typeof messages> = {};
    let roundTracker = 1;

    messages.forEach((msg) => {
      if (!grouped[roundTracker]) grouped[roundTracker] = [];
      grouped[roundTracker].push(msg);

      // Nếu gặp tin nhắn của Điều phối viên (System) chứa "TÓM TẮT VÒNG",
      // thì đó là tin nhắn cuối cùng của vòng hiện tại.
      // Các tin nhắn sau đó sẽ thuộc vòng tiếp theo.
      if (msg.role === 'system') {
        roundTracker++;
      }
    });

    return grouped;
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const content = input;
    setInput("");

    await sendMessage.mutateAsync({ id: debateId, content });
  };

  const moveToNextRound = () => {
    const nextRound = selectedRound + 1;
    if (nextRound <= 5) {
      setSelectedRound(nextRound);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!data || !debate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Không tìm thấy cuộc tranh luận</h1>
        <a href="/" className="text-primary hover:underline font-semibold">Quay về trang chủ</a>
      </div>
    );
  }

  const rounds = [1, 2, 3, 4, 5];
  // Lấy tin nhắn của round đang chọn
  const currentRoundMessages = messagesByRound[selectedRound] || [];

  // Logic hiển thị Input Area:
  // 1. Show Input: Khi đang ở activeRound VÀ debate chưa kết thúc.
  // 2. Show Button "Next Round": Khi đang ở round cũ (selectedRound < activeRound) VÀ chưa phải round cuối.
  const showInputArea = selectedRound === activeRound && !isDebateEnded;
  const showNextRoundButton = selectedRound < activeRound && selectedRound < 5;

  // Placeholder text thay đổi theo vòng
  const getPlaceholder = (round: number) => {
    if (round === 1) return "Nhập phát biểu mở đầu của bạn (150-200 từ)...";
    if (round === 2) return "Triển khai 3 Lập luận chính kèm bằng chứng...";
    if (round === 3) return "Phản bác chéo: Đặt câu hỏi chất vấn đối thủ...";
    if (round === 4) return "Tổng kết và Phản biện lại các luận điểm...";
    if (round === 5) return "Đưa ra Tuyên bố Kết luận cuối cùng...";
    return "Nhập tin nhắn...";
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-body text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Dot Pattern Background */}
      <div className="fixed inset-0 dot-bg bg-dot-pattern opacity-[0.05] pointer-events-none"></div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col min-h-screen">
        <Header />

        {/* Round Navigation (Tabs) */}
        <nav className="flex flex-wrap justify-between gap-2 mb-6">
          {rounds.map((round) => {
            // Nút active nếu round <= activeRound (đã mở)
            // Nếu debate đã kết thúc (activeRound > 5), thì cả 5 nút đều active để xem lại
            const isUnlocked = round <= activeRound;
            const isSelected = selectedRound === round;

            return (
              <button
                key={round}
                onClick={() => isUnlocked && setSelectedRound(round)}
                disabled={!isUnlocked}
                className={clsx(
                  "flex-1 min-w-[100px] py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-sm relative overflow-hidden",
                  isSelected
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10"
                    : isUnlocked
                      ? "bg-white dark:bg-slate-800 border-2 border-primary/10 text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed border-2 border-transparent"
                )}
              >
                {round === 1 ? "MỞ ĐẦU" : `VÒNG ${round}`}
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-0 bottom-0 h-1 bg-white/30"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Moderator Card - Debate Topic */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              ĐIỀU PHỐI VIÊN
            </span>
          </div>
          <div className="bg-primary text-white p-6 rounded-2xl rounded-tl-none shadow-xl">
            <h3 className="font-bold text-sm mb-2 uppercase opacity-80 italic tracking-wider">
              CHỦ ĐỀ DEBATE
            </h3>
            <p className="font-extrabold text-xl md:text-2xl mb-4 leading-tight">
              {debate.refined_topic || debate.topic}
            </p>

            {/* Chỉ hiện hướng dẫn của Moderator nếu đang ở Vòng 1 hoặc nếu nó tồn tại */}
            {/* Logic mới: Moderator Intro (vòng 1) luôn hiển thị ở Tab Vòng 1 */}
            {selectedRound === 1 && debate.moderator_intro && (
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {debate.moderator_intro}
                </div>
              </div>
            )}

            {/* Dynamic Status Bar */}
            <div className="font-medium text-sm leading-relaxed border-t border-white/20 pt-4 flex flex-col md:flex-row md:items-center gap-2 mt-4">
              {isDebateEnded ? (
                <span className="text-yellow-300 font-bold italic whitespace-nowrap flex items-center gap-2">
                  <History className="w-4 h-4" /> CUỘC TRANH LUẬN ĐÃ KẾT THÚC
                </span>
              ) : (
                <span className="text-yellow-300 font-bold italic whitespace-nowrap">
                  Trạng thái: {selectedRound === activeRound ? "Đang diễn ra" : "Xem lại lịch sử"}
                </span>
              )}
              <span className="hidden md:block opacity-40">|</span>
              <span className="opacity-90">
                Bạn đang xem: {selectedRound === 1 ? "Vòng Mở Đầu" : `Vòng ${selectedRound}`}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-2 border-black dark:border-white/20 mb-6" />

        {/* Round Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="w-2.5 h-10 bg-primary rounded-full"></span>
            {selectedRound === 1 ? "MỞ ĐẦU" : `VÒNG ${selectedRound}`}
          </h2>

          <p className="text-slate-500 mt-2 font-medium">
            {selectedRound === 1 ? "Phát biểu mở đầu (150-200 từ)" :
              selectedRound === 2 ? "Triển khai 3 Lập luận chính kèm bằng chứng" :
                selectedRound === 3 ? "Phản bác chéo" :
                  selectedRound === 4 ? "Tổng kết và Phản biện lại" :
                    selectedRound === 5 ? "Tuyên bố Kết luận cuối cùng" : ""}
          </p>
        </div>

        {/* Chat Area - Chỉ hiển thị message của selectedRound */}
        <div className="space-y-8 mb-8 flex-grow min-h-[300px]">
          {currentRoundMessages.length === 0 && selectedRound === activeRound && !sendMessage.isPending && (
            <div className="text-center text-slate-400 py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p>Chưa có nội dung cho vòng này. Hãy bắt đầu tranh luận!</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {currentRoundMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const isModerator = msg.role === 'system';

              // Moderator Summary Style
              if (isModerator) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="my-8"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          ĐIỀU PHỐI VIÊN - TÓM TẮT VÒNG {selectedRound}
                        </span>
                      </div>
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Normal User/AI Message Style
              const roleLabel = isUser
                ? (debate.side === 'support' ? 'KHẲNG ĐỊNH ( NGƯỜI )' : 'PHỦ ĐỊNH ( NGƯỜI )')
                : (debate.side === 'support' ? 'PHỦ ĐỊNH ( MÁY )' : 'KHẲNG ĐỊNH ( MÁY )');

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "space-y-2",
                    isUser ? "flex flex-col items-end" : ""
                  )}
                >
                  <div className={clsx(
                    "flex items-center gap-2",
                    isUser ? "justify-end" : ""
                  )}>
                    {!isUser && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {roleLabel}
                    </span>
                    {isUser && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                  </div>
                  <div className={clsx(
                    "bg-primary/5 dark:bg-primary/10 border border-primary/20 p-6 rounded-2xl max-w-2xl",
                    isUser ? "rounded-tr-none" : "rounded-tl-none"
                  )}>
                    <p className={clsx(
                      "text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line",
                      isUser ? "text-right" : ""
                    )}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading State - Chỉ hiện khi đang ở đúng vòng active */}
          {sendMessage.isPending && selectedRound === activeRound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                {debate.side === 'support' ? (
                  <>
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      PHỦ ĐỊNH ( MÁY )
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      ĐIỀU PHỐI VIÊN
                    </span>
                  </>
                )}
              </div>
              <div className={clsx(
                "border p-6 rounded-2xl rounded-tl-none max-w-2xl",
                debate.side === 'support'
                  ? "bg-primary/5 dark:bg-primary/10 border-primary/20"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
              )}>
                <p className={clsx(
                  "leading-relaxed font-medium flex items-center gap-2",
                  debate.side === 'support'
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-amber-700 dark:text-amber-400"
                )}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {debate.side === 'support'
                    ? "AI đang suy nghĩ phản biện..."
                    : "Đang tổng kết vòng đấu & Chuẩn bị vòng tiếp theo..."}
                </p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Area: Input khi active, hoặc Thông báo khi xem history */}
        <div className="pb-8 sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm pt-4 border-t border-slate-200 dark:border-slate-800 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:border-none md:static">
          {showInputArea ? (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={sendMessage.isPending}
                  className="w-full bg-primary text-white placeholder:text-white/60 py-4 px-6 rounded-full border-none shadow-lg focus:ring-4 focus:ring-primary/20 outline-none font-medium disabled:opacity-50"
                  placeholder={getPlaceholder(activeRound)}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                className="bg-primary hover:bg-[#C2185B] text-white px-8 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                GỬI
              </button>
            </div>
          ) : showNextRoundButton ? (
            <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl text-center border-2 border-green-200 dark:border-green-800 shadow-xl">
              <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">
                VÒNG {selectedRound} ĐÃ HOÀN THÀNH
              </h3>
              <p className="text-green-600 dark:text-green-400 mb-4">
                Bạn đã sẵn sàng để tiếp tục cuộc tranh luận?
              </p>
              <button
                onClick={moveToNextRound}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 animate-pulse"
              >
                TIẾP TỤC SANG VÒNG {selectedRound + 1} ➔
              </button>
            </div>
          ) : isDebateEnded ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl text-center border-2 border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">CUỘC TRANH LUẬN ĐÃ KẾT THÚC</h3>
              <p className="text-slate-500">Bạn đang xem lại nội dung lưu trữ của 5 vòng tranh luận.</p>
              <a href="/" className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-full font-bold uppercase text-sm hover:shadow-lg transition-all">
                Bắt đầu cuộc tranh luận mới
              </a>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl text-center border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
              <History className="w-5 h-5" />
              <span className="font-medium">Bạn đang xem lại nội dung Vòng {selectedRound}. Hãy chuyển sang <button onClick={() => setSelectedRound(activeRound)} className="underline font-bold hover:text-amber-800">Vòng {activeRound} (Hiện tại)</button> để tiếp tục.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
