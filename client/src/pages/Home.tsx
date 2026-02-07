import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateDebate } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DebateHistory } from "@/components/DebateHistory";
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
    <div className="bg-background-light dark:bg-background-dark font-body text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Dot Pattern Background */}
      <div className="fixed inset-0 dot-bg bg-dot-pattern opacity-[0.05] pointer-events-none"></div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Header />

        {/* Hero Section */}
        <section className="text-center mb-10">
          <h1 className="text-2xl md:text-4xl font-display font-bold text-primary mb-2 uppercase tracking-tight">
            CHÀO MỪNG BẠN ĐẾN VỚI ESCAPE AI DEBATE
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Nâng tầm tư duy phản biện cùng trí tuệ nhân tạo
          </p>
        </section>

        {/* Input Section */}
        <div className="space-y-6 mb-12">
          {/* Topic Input */}
          <div className="relative">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-primary text-white placeholder:text-white/70 text-center py-4 px-6 rounded-xl border-none font-semibold text-lg italic shadow-lg focus:ring-4 focus:ring-primary/20 transition-all outline-none"
              placeholder="Nhập chủ đề ( motion )"
              type="text"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>

          {/* Side Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSide("support")}
              className={clsx(
                "border-2 border-primary py-3 px-6 rounded-full font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95",
                side === "support"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-primary hover:bg-primary hover:text-white"
              )}
            >
              ỦNG HỘ
            </button>
            <button
              onClick={() => setSide("oppose")}
              className={clsx(
                "border-2 border-primary py-3 px-6 rounded-full font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95",
                side === "oppose"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-primary hover:bg-primary hover:text-white"
              )}
            >
              PHẢN ĐỐI
            </button>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={createDebate.isPending}
            className="w-full bg-primary hover:bg-[#C2185B] text-white py-5 rounded-xl font-display font-bold text-xl uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {createDebate.isPending ? (
              "ĐANG KHỞI TẠO..."
            ) : (
              <>
                BẮT ĐẦU DEBATE
                <svg
                  className="w-6 h-6 transition-transform group-hover:translate-x-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* History Section */}
        <section className="mb-16">
          <div className="bg-primary text-white px-8 py-3 rounded-t-xl font-display font-bold text-center uppercase tracking-widest">
            LỊCH SỬ DEBATE
          </div>
          <DebateHistory />
        </section>

        <Footer />
      </main>
    </div>
  );
}
