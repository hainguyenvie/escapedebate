import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useDebate, useSendMessage } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function DebateSession() {
  const [, params] = useRoute("/debate/:id");
  const debateId = params ? parseInt(params.id) : 0;

  const { data, isLoading } = useDebate(debateId);
  const sendMessage = useSendMessage();

  const [input, setInput] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const content = input;
    setInput("");

    await sendMessage.mutateAsync({ id: debateId, content });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Không tìm thấy cuộc tranh luận</h1>
        <a href="/" className="text-primary hover:underline font-semibold">Quay về trang chủ</a>
      </div>
    );
  }

  const { debate, messages } = data;
  const rounds = [1, 2, 3, 4, 5];

  return (
    <div className="bg-background-light dark:bg-background-dark font-body text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Dot Pattern Background */}
      <div className="fixed inset-0 dot-bg bg-dot-pattern opacity-[0.05] pointer-events-none"></div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col min-h-screen">
        <Header />

        {/* Round Navigation */}
        <nav className="flex flex-wrap justify-between gap-2 mb-6">
          {rounds.map((round) => {
            const isAvailable = round <= debate.current_round;
            return (
              <button
                key={round}
                onClick={() => isAvailable && setCurrentRound(round)}
                disabled={!isAvailable}
                className={clsx(
                  "flex-1 min-w-[100px] py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-sm",
                  currentRound === round && isAvailable
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : isAvailable
                      ? "border-2 border-primary/30 text-primary hover:bg-primary/5"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-2 border-slate-300 dark:border-slate-700"
                )}
              >
                {round === 1 ? "MỞ ĐẦU" : `VÒNG ${round}`}
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

            {/* Moderator Intro - Content from LLM */}
            {debate.moderator_intro && (
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {debate.moderator_intro}
                </div>
              </div>
            )}

            {!debate.moderator_intro && (
              <div className="font-medium text-sm leading-relaxed border-t border-white/20 pt-4 flex flex-col md:flex-row md:items-center gap-2">
                <span className="text-yellow-300 font-bold italic whitespace-nowrap">
                  Vòng {currentRound}: {currentRound === 1 ? "Phát biểu mở đầu" : `Vòng tranh luận ${currentRound}`}
                </span>
                <span className="hidden md:block opacity-40">|</span>
                <span className="opacity-90">
                  Bên {debate.side === 'support' ? 'Khẳng định' : 'Phủ định'} (Bạn) đang tranh luận với AI.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-2 border-black dark:border-white/20 mb-6" />

        {/* Round Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="w-2.5 h-10 bg-primary rounded-full"></span>
            {currentRound === 1 ? "MỞ ĐẦU" : `VÒNG ${currentRound}`}
          </h2>
        </div>

        {/* Chat Area */}
        <div className="space-y-8 mb-8 flex-grow">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isModerator = msg.role === 'system';

            // Nếu là moderator summary, hiển thị với style đặc biệt
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
                        ĐIỀU PHỐI VIÊN - TÓM TẮT
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

            // Message bình thường của user hoặc AI
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
                    "text-slate-700 dark:text-slate-300 leading-relaxed font-medium",
                    isUser ? "text-right" : ""
                  )}>
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {sendMessage.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {debate.side === 'support' ? 'PHỦ ĐỊNH ( MÁY )' : 'KHẲNG ĐỊNH ( MÁY )'}
                </span>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-6 rounded-2xl rounded-tl-none max-w-2xl">
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI đang suy nghĩ phản biện...
                </p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area Below Chat */}
        <div className="pb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={sendMessage.isPending}
                className="w-full bg-primary text-white placeholder:text-white/60 py-4 px-6 rounded-full border-none shadow-lg focus:ring-4 focus:ring-primary/20 outline-none font-medium disabled:opacity-50"
                placeholder="Nhập lập luận của bạn"
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
        </div>
      </main>
    </div>
  );
}
