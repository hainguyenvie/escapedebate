import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "";

  const dropdown = menuOpen ? createPortal(
    <div
      ref={menuRef}
      style={{ top: menuPos.top, right: menuPos.right, position: "fixed", zIndex: 99999 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 py-2 w-52"
    >
      <div className="px-4 py-2 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 truncate" data-testid="text-username">
          {displayName}
        </p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
      </div>
      <button
        data-testid="button-signout"
        onClick={() => { signOut(); setMenuOpen(false); }}
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
      >
        Đăng xuất
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <header className="mb-10 w-full">
      <div className="relative rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-4xl mx-auto bg-gradient-to-br from-[#E91E63] to-[#c2185b] border-2 border-[#E91E63] shadow-[0_4px_15px_rgba(233,30,99,0.25)] group">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-3xl" />
        <div className="absolute -inset-1 bg-[#E91E63] rounded-3xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 pointer-events-none"></div>

        <Link href="/">
          <div className="relative z-10 flex items-center gap-3 cursor-pointer">
            <div className="text-white font-black text-2xl md:text-3xl tracking-widest drop-shadow-sm">
              ESCAPE{" "}
              <span className="font-bold text-white/80 text-lg uppercase tracking-[0.2em] pl-1 border-l-2 border-white/30 ml-2">
                AI DEBATE
              </span>
            </div>
          </div>
        </Link>

        <div className="relative z-10 flex items-center gap-4">
          <div className="text-[10px] md:text-xs font-display font-bold text-white uppercase tracking-[0.25em] text-center md:text-right drop-shadow-sm opacity-90">
            PRESS ESCAPE, SHAPE YOUR MIND
          </div>

          {user && (
            <div className="relative">
              <button
                ref={btnRef}
                data-testid="button-user-avatar"
                onClick={handleAvatarClick}
                className="w-9 h-9 rounded-full border-2 border-white/50 overflow-hidden flex items-center justify-center bg-white/20 hover:border-white transition-all active:scale-95 shrink-0"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    data-testid="img-avatar"
                  />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {dropdown}
    </header>
  );
}
