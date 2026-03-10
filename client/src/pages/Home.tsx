import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateDebate } from "@/hooks/use-debates";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DebateHistory } from "@/components/DebateHistory";
import { useToast } from "@/hooks/use-toast";
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

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStart = async () => {
    if (!topic.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập chủ đề bạn muốn tranh luận!",
        variant: "destructive",
      });
      return;
    }

    if (!side) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn phe của bạn (Ủng hộ hoặc Phản đối)!",
        variant: "destructive",
      });
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

  const centerContent = (
    <div className="flex flex-col items-center justify-center w-full z-20 relative pt-4">
      {/* Sparkles Explosion Container */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10" style={{ transform: 'translateY(-2rem)' }}>
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const dist = 140 + Math.random() * 150;
          return (
            <div 
              key={i} 
              className="sparkle-star"
              style={{
                '--tx': `${Math.cos(angle) * dist}px`,
                '--ty': `${Math.sin(angle) * dist}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <button 
        onClick={handleStart}
        disabled={createDebate.isPending}
        className="cyber-key cyber-key-esc w-48 h-48 md:w-56 md:h-56 lg:w-[15rem] lg:h-[15rem] z-20 mx-auto"
      >
        <div className="cyber-key-top text-center leading-[1.1]">
          {createDebate.isPending ? "..." : "ESC"}
        </div>
      </button>

      <div className="mt-10 font-black text-2xl md:text-3xl text-white tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] text-center w-full z-10 relative">
        BẮT ĐẦU DEBATE
      </div>
    </div>
  );

  return (
    <div className="relative font-body text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300 pb-10 overflow-x-hidden">
      <div className="cyberspace-bg" />
      <div className="cyberspace-glow" />
      
      {/* Floating Background Keys */}
      <div className="key-floating hidden md:block" style={{ top: '22%', left: '8%', animationDelay: '0s', width: '96px', height: '96px' }}>
        <div className="cyber-key w-full h-full"><div className="cyber-key-top font-bold text-slate-700 text-xl md:text-2xl drop-shadow-md">CTRL</div></div>
      </div>
      <div className="key-floating hidden md:block" style={{ top: '35%', right: '6%', animationDelay: '1s', width: '110px', height: '96px' }}>
        <div className="cyber-key w-full h-full"><div className="cyber-key-top font-bold text-slate-700 text-xl md:text-2xl drop-shadow-md">SPACE</div></div>
      </div>
      <div className="key-floating hidden md:block" style={{ bottom: '35%', left: '12%', animationDelay: '2s', width: '96px', height: '96px' }}>
        <div className="cyber-key w-full h-full"><div className="cyber-key-top font-bold text-slate-700 text-xl md:text-2xl drop-shadow-md">CTRL</div></div>
      </div>
      <div className="key-floating hidden md:block" style={{ bottom: '30%', right: '10%', animationDelay: '3s', width: '110px', height: '96px' }}>
        <div className="cyber-key w-full h-full"><div className="cyber-key-top font-bold text-slate-700 text-xl md:text-2xl drop-shadow-md">SPACE</div></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-10 flex flex-col items-center">
        <Header />

        {/* Hero Section */}
        <section className="relative w-full max-w-4xl mx-auto mb-10 min-h-[140px] md:min-h-[160px] cursor-default">
          <div className="absolute inset-0 bg-[#cbd5e1] rounded-[24px] shadow-[0px_14px_0px_0px_#94a3b8,0px_25px_30px_rgba(0,0,0,0.15),inset_0px_2px_2px_rgba(255,255,255,1),inset_2px_0px_2px_rgba(255,255,255,0.5),inset_-2px_0px_2px_rgba(0,0,0,0.1)] transition-transform"></div>
          <div className="absolute inset-[4px_6px_14px_6px] bg-gradient-to-b from-[#f8fafc] to-[#e8eef3] rounded-[16px] shadow-[inset_0px_6px_10px_rgba(0,0,0,0.03),inset_0px_-6px_10px_rgba(255,255,255,1),0px_3px_5px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-6 md:p-8 z-10 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-[#1e293b] mb-2 uppercase tracking-tight">
              CHÀO MỪNG BẠN ĐẾN VỚI ESCAPE AI DEBATE
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base hidden sm:block">
              Nâng tầm tư duy phản biện cùng trí tuệ nhân tạo
            </p>
          </div>
        </section>

        {/* Input Section (ENTER combo) */}
        <div className="relative mb-8 w-full max-w-4xl flex items-stretch h-16 md:h-20 gap-3 md:gap-4">
          <div className="cyber-key-enter-body w-32 md:w-40 shrink-0 relative cursor-default">
            <div className="cyber-key-enter-top font-black text-slate-500 text-lg md:text-xl justify-center">
              ENTER
            </div>
          </div>
          <div className="flex-1 relative h-full">
            <div className="cyber-key-enter-body w-full h-full relative cursor-text">
               <input
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 className="absolute inset-[4px_6px_12px_6px] rounded-[10px] bg-[#ffffff] shadow-[inset_0px_6px_10px_rgba(0,0,0,0.04),inset_0px_-6px_10px_rgba(255,255,255,1),0px_2px_4px_rgba(0,0,0,0.1)] text-slate-800 placeholder:text-slate-400 text-center px-6 md:px-8 font-semibold text-base md:text-xl italic outline-none flex items-center transition-all focus:bg-[#f8fafc]"
                 placeholder="Nhập chủ đề (motion)"
                 type="text"
               />
            </div>
          </div>
        </div>

        {/* TAB Keys Selection */}
        <div className="flex justify-between items-center w-full max-w-4xl mb-6 px-2 space-x-4">
          <button 
            onClick={() => setSide("support")}
            className={clsx(
              "cyber-key w-40 md:w-56 h-20 md:h-24",
              side === "support" ? "active-press" : ""
            )}
          >
            <div className="cyber-key-top text-lg md:text-2xl relative">
               <span className="absolute top-2 left-3 text-[10px] md:text-xs text-slate-400 font-bold tracking-widest">TAB</span>
               <span className="text-[#10b981] font-black uppercase tracking-wide">ỦNG HỘ</span>
               <div className={clsx("key-led !mt-0 absolute bottom-3 right-4", side === "support" ? "green" : "")} />
            </div>
          </button>

          <button 
            onClick={() => setSide("oppose")}
            className={clsx(
              "cyber-key w-40 md:w-56 h-20 md:h-24",
              side === "oppose" ? "active-press" : ""
            )}
          >
            <div className="cyber-key-top text-lg md:text-2xl relative">
               <span className="absolute top-2 left-3 text-[10px] md:text-xs text-slate-400 font-bold tracking-widest">TAB</span>
               <span className="text-[#ef4444] font-black uppercase tracking-wide">PHẢN ĐỐI</span>
               <div className={clsx("key-led !mt-0 absolute bottom-3 right-4", side === "oppose" ? "red" : "")} />
            </div>
          </button>
        </div>

        {/* The Pink Board holding Debate History + ESC */}
        <div className="pink-board w-full max-w-5xl mt-20 md:mt-24 mb-12 relative z-10 !rounded-tl-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] rounded-[28px] !rounded-tl-none pointer-events-none mix-blend-overlay"></div>
          
          {/* Folder Tab LỊCH SỬ DEBATE at Top Left */}
          <div className="absolute -top-[44px] left-[-1px] h-[48px] px-6 lg:px-8 bg-[#E91E63] border-t border-l border-r border-[#E91E63] shadow-[0_-5px_15px_rgba(233,30,99,0.2)] rounded-t-[20px] flex items-center justify-center gap-2 pt-2 -z-10">
            <span className="text-xs lg:text-sm font-black text-white/90 uppercase tracking-widest drop-shadow-sm">LỊCH SỬ DEBATE</span>
            <div className="h-0.5 w-8 lg:w-16 bg-white/40" />
          </div>

          <div className="relative z-10 w-full h-full"> 
             <DebateHistory centerContent={centerContent} />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Nội dung không phù hợp
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
