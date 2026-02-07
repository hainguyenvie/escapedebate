import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useDebate, useSendMessage } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Send, User, Bot, Loader2, Trophy, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function DebateSession() {
  const [, params] = useRoute("/debate/:id");
  const debateId = params ? parseInt(params.id) : 0;
  
  const { data, isLoading } = useDebate(debateId);
  const sendMessage = useSendMessage();
  
  const [input, setInput] = useState("");
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
    
    // Optimistic UI could be handled here if needed, but react-query invalidation is safer
    await sendMessage.mutateAsync({ id: debateId, content });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Không tìm thấy cuộc tranh luận</h1>
        <a href="/" className="text-primary hover:underline">Quay về trang chủ</a>
      </div>
    );
  }

  const { debate, messages } = data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col h-full max-w-5xl">
        {/* Debate Header Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chủ đề tranh luận</span>
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border",
                  debate.side === 'support' 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  Bạn: {debate.side === 'support' ? 'Ủng hộ' : 'Phản đối'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 leading-tight">
                {debate.topic}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-400 uppercase">Đối thủ</div>
                <div className="font-bold text-slate-800">AI Master Debater</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow bg-white rounded-2xl shadow-sm border border-slate-100 relative flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
             {/* Welcome message */}
            <div className="flex justify-center my-4">
               <div className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1 rounded-full">
                 CUỘC TRANH LUẬN BẮT ĐẦU
               </div>
            </div>

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex gap-4 max-w-[85%]",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                    isUser ? "bg-primary text-white" : "bg-slate-800 text-white"
                  )}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={clsx(
                    "p-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-sm",
                    isUser 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-slate-100 text-slate-800 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}

            {sendMessage.isPending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-4 max-w-[85%] mr-auto"
              >
                 <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100 text-slate-500 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI đang suy nghĩ phản biện...
                  </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập luận điểm của bạn..."
                disabled={sendMessage.isPending}
                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sendMessage.isPending}
                className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
      
      {/* Hide footer on small screens when chatting to save space */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
