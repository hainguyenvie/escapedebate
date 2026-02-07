import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateDebate } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DebateHistory } from "@/components/DebateHistory";
import { ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [side, setSide] = useState<"support" | "oppose">("support");
  const [, setLocation] = useLocation();
  const createDebate = useCreateDebate();
  const { toast } = useToast();

  const handleStart = async () => {
    if (!topic.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập chủ đề bạn muốn tranh luận!",
        variant: "destructive",
      });
      return;
    }

    try {
      const debate = await createDebate.mutateAsync({ topic, side });
      setLocation(`/debate/${debate.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4" /> AI Powered Debate Arena
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-tight mb-4">
            CHÀO MỪNG BẠN ĐẾN VỚI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-600">
              ESCAPE AI DEBATE
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Nâng tầm tư duy phản biện cùng trí tuệ nhân tạo. 
            Chọn chủ đề, chọn phe, và bắt đầu cuộc chiến ngôn từ.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-primary/5 border border-slate-100 mb-20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-pink-500" />
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Nhập chủ đề (Motion)
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: AI sẽ thay thế lập trình viên trong 5 năm tới..."
                className="w-full text-xl md:text-2xl font-medium p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Bạn chọn phe nào?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSide("support")}
                  className={clsx(
                    "relative p-4 md:p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 group",
                    side === "support"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10"
                      : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/30"
                  )}
                >
                  <ThumbsUp className={clsx("w-8 h-8", side === "support" ? "fill-current" : "")} />
                  <span className="text-lg font-bold font-display uppercase">Ủng Hộ</span>
                  {side === "support" && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setSide("oppose")}
                  className={clsx(
                    "relative p-4 md:p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 group",
                    side === "oppose"
                      ? "bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-500/10"
                      : "bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-rose-50/30"
                  )}
                >
                  <ThumbsDown className={clsx("w-8 h-8", side === "oppose" ? "fill-current" : "")} />
                  <span className="text-lg font-bold font-display uppercase">Phản Đối</span>
                  {side === "oppose" && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={createDebate.isPending}
              className="w-full py-5 rounded-2xl bg-primary text-white text-xl font-bold font-display uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {createDebate.isPending ? (
                <>Đang khởi tạo...</>
              ) : (
                <>Bắt đầu Debate <Zap className="w-5 h-5 fill-current" /></>
              )}
            </button>
          </div>
        </motion.div>

        {/* History Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-800">LỊCH SỬ DEBATE</h2>
            <div className="h-1 flex-grow bg-slate-100 rounded-full" />
          </div>
          <DebateHistory />
        </div>
      </main>

      <Footer />
    </div>
  );
}
