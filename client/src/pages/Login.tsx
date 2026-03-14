import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="relative font-body min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="cyberspace-bg" />
      <div className="cyberspace-glow" />

      {/* Logo */}
      <div className="relative z-10 mb-12">
        <div className="text-[#E91E63] font-black text-2xl md:text-3xl tracking-widest">
          ESCAPE{" "}
          <span className="font-bold text-slate-400 text-lg uppercase tracking-[0.2em] pl-2 border-l-2 border-slate-300 ml-1">
            AI DEBATE
          </span>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-[#fce7f3]/30 rounded-[24px] border-2 border-[#E91E63]/30 shadow-sm"></div>
        <div className="absolute inset-[4px_6px_6px_6px] bg-white rounded-[16px] border border-pink-100"></div>

        <div className="relative z-10 flex flex-col items-center px-8 py-12 text-center">
          <h1 className="text-2xl md:text-3xl font-display font-black text-[#E91E63] uppercase leading-tight mb-2">
            CHÀO MỪNG BẠN ĐẾN
            <br />
            VỚI ESCAPE AI DEBATE
          </h1>
          <p className="text-slate-400 font-semibold text-xs tracking-[0.2em] uppercase mb-10">
            PRESS ESCAPE, SHAPE YOUR MIND
          </p>

          <button
            data-testid="button-google-login"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-700 font-semibold text-base hover:border-[#E91E63]/50 hover:bg-pink-50/50 transition-all active:scale-95"
          >
            <SiGoogle className="w-5 h-5" />
            Đăng nhập bằng Gmail
          </button>

          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <span className="text-[#E91E63] cursor-pointer hover:underline">Điều khoản Dịch vụ</span>{" "}
            và{" "}
            <span className="text-[#E91E63] cursor-pointer hover:underline">Chính sách Bảo mật</span>{" "}
            của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}
