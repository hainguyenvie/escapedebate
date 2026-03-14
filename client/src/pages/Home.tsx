import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateDebate } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DebateHistory } from "@/components/DebateHistory";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import clsx from "clsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [side, setSide] = useState<"support" | "oppose" | null>(null);
  const [, setLocation] = useLocation();
  const createDebate = useCreateDebate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStart = async () => {
    if (!topic.trim()) {
      setErrorMessage("Vui lòng nhập chủ đề bạn muốn tranh luận!");
      setErrorOpen(true);
      return;
    }

    if (!side) {
      setErrorMessage("Bạn chưa chọn phe! Vui lòng chọn phe Ủng hộ hoặc Phản đối để bắt đầu.");
      setErrorOpen(true);
      return;
    }

    try {
      const debate = await createDebate.mutateAsync({ topic, side });
      setLocation(`/debate/${debate.id}`);
    } catch (error: any) {
      setErrorMessage(error.message || "Đã có lỗi xảy ra khi tạo cuộc tranh luận.");
      setErrorOpen(true);
    }
  };

  return (
    <div className="relative font-body text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300 pb-10 overflow-x-hidden">
      <div className="cyberspace-bg" />
      <div className="cyberspace-glow" />
      

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-10 flex flex-col items-center">
        <Header />

        {/* Hero Section */}
        <section className="relative w-full max-w-4xl mx-auto mb-10 min-h-[140px] md:min-h-[160px] cursor-default">
          <div className="absolute inset-0 bg-[#fce7f3]/30 rounded-[24px] border-2 border-[#E91E63]/40 shadow-sm transition-transform"></div>
          <div className="absolute inset-[4px_6px_6px_6px] bg-[#ffffff] rounded-[16px] border border-pink-100 flex flex-col items-center justify-center p-6 md:p-8 z-10 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-[#1e293b] mb-2 uppercase tracking-tight">
              CHÀO MỪNG BẠN ĐẾN VỚI ESCAPE AI DEBATE
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base hidden sm:block">
              Nâng tầm tư duy phản biện cùng trí tuệ nhân tạo
            </p>
          </div>
        </section>

        {/* Input Section (ENTER combo) */}
        <div className="relative mb-8 w-full max-w-4xl flex flex-col md:flex-row items-stretch h-auto md:h-20 gap-3 md:gap-4">
          <div className="flex-1 relative h-16 md:h-full">
            <div className="cyber-key-enter-body w-full h-full relative cursor-text">
               <input
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleStart();
                 }}
                 className="absolute inset-[4px_6px_6px_6px] rounded-[10px] bg-[#ffffff] border border-slate-200/60 text-slate-800 placeholder:text-slate-400 text-center px-6 md:px-8 font-semibold text-base md:text-xl italic outline-none flex items-center transition-all focus:bg-[#f8fafc] focus:border-pink-300"
                 placeholder="Nhập chủ đề (motion)"
                 type="text"
               />
            </div>
          </div>
          <button 
            onClick={user ? handleStart : () => setLocation("/login")}
            disabled={createDebate.isPending}
            data-testid="button-enter"
            className="cyber-key-enter-body w-full md:w-40 h-14 md:h-full shrink-0 relative flex items-center justify-center group active:scale-95 transition-transform"
          >
            <div className="cyber-key-enter-top font-black text-slate-500 text-lg md:text-xl justify-center group-hover:text-pink-500 transition-colors">
              {createDebate.isPending ? "..." : user ? "ENTER" : "Đăng nhập"}
            </div>
          </button>
        </div>

        {/* TAB Keys Selection */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-4xl mb-6 px-2 gap-4 md:space-x-4">
          <div className="flex md:hidden items-center justify-center w-full mb-2">
            <span className="font-black text-base text-slate-500 uppercase tracking-widest text-center select-none">
              BẠN CHỌN PHE NÀO?
            </span>
          </div>

          <div className="flex justify-between items-center w-full gap-4">
            <button 
              onClick={() => setSide("support")}
              className={clsx(
                "cyber-key flex-1 md:w-56 h-20 md:h-24 !border-[#10b981]/60 !bg-emerald-50/50",
                side === "support" ? "active-press !bg-emerald-100/80" : ""
              )}
            >
              <div className="cyber-key-top text-base md:text-2xl relative">
                 <span className="text-[#10b981] font-black uppercase tracking-wide">ỦNG HỘ</span>
                 <div className={clsx("key-led !mt-0 absolute bottom-3 right-3 md:right-4", side === "support" ? "green" : "")} />
              </div>
            </button>

            <div className="hidden md:flex flex-1 items-center justify-center px-2">
              <span className="font-black text-base md:text-lg lg:text-xl text-slate-500 uppercase tracking-widest text-center select-none whitespace-nowrap">
                BẠN CHỌN PHE NÀO?
              </span>
            </div>

            <button 
              onClick={() => setSide("oppose")}
              className={clsx(
                "cyber-key flex-1 md:w-56 h-20 md:h-24 !border-[#ef4444]/60 !bg-red-50/50",
                side === "oppose" ? "active-press !bg-red-100/80" : ""
              )}
            >
              <div className="cyber-key-top text-base md:text-2xl relative">
                 <span className="text-[#ef4444] font-black uppercase tracking-wide">PHẢN ĐỐI</span>
                 <div className={clsx("key-led !mt-0 absolute bottom-3 right-3 md:right-4", side === "oppose" ? "red" : "")} />
              </div>
            </button>
          </div>
        </div>

        {/* The Pink Board holding Debate History */}
        <div className="pink-board w-full max-w-5xl mt-12 md:mt-20 mb-12 relative z-10 !rounded-tl-none !p-3 md:!p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] rounded-[28px] !rounded-tl-none pointer-events-none mix-blend-overlay"></div>
          
          {/* Folder Tab */}
          <div className="absolute -top-[44px] left-[-1px] h-[48px] px-6 lg:px-8 bg-[#E91E63] border-t border-l border-r border-[#E91E63] shadow-[0_-5px_15px_rgba(233,30,99,0.2)] rounded-t-[20px] flex items-center justify-center gap-2 pt-2 z-20">
            <span className="text-xs lg:text-sm font-black text-white/90 uppercase tracking-widest drop-shadow-sm">LỊCH SỬ DEBATE</span>
            <div className="h-0.5 w-8 lg:w-16 bg-white/40" />
          </div>

          <div className="relative z-10 w-full h-full">
            <DebateHistory />
          </div>
        </div>

        <div className="w-full max-w-5xl">
          <Footer />
        </div>

      </main>

      {/* Error Alert Dialog */}
      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Chú ý
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 mt-2 text-base leading-relaxed font-medium">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end">
            <AlertDialogAction
              onClick={() => setErrorOpen(false)}
              className="cyber-key !h-10 w-24"
            >
              <div className="cyber-key-top text-xs !font-bold">Đã hiểu</div>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
