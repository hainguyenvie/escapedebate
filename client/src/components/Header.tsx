import { Link } from "wouter";

export function Header() {
  return (
    <header className="mb-10 w-full">
      <Link href="/">
        <div className="relative rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer overflow-hidden max-w-4xl mx-auto bg-gradient-to-br from-[#E91E63] to-[#c2185b] border-2 border-[#E91E63] shadow-[0_4px_15px_rgba(233,30,99,0.25)] transition-transform active:scale-95 group">
          {/* Subtle top reflection */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Outer glow aura behind the header */}
          <div className="absolute -inset-1 bg-[#E91E63] rounded-3xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
             <div className="text-white font-black text-2xl md:text-3xl tracking-widest drop-shadow-sm">
               ESCAPE <span className="font-bold text-white/80 text-lg uppercase tracking-[0.2em] pl-1 border-l-2 border-white/30 ml-2">AI DEBATE</span>
             </div>
          </div>
          <div className="relative z-10 text-[10px] md:text-xs font-display font-bold text-white uppercase tracking-[0.25em] text-center md:text-right drop-shadow-sm opacity-90">
            PRESS ESCAPE, SHAPE YOUR MIND
          </div>
        </div>
      </Link>
    </header>
  );
}
