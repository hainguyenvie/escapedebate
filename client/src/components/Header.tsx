import { Link } from "wouter";

export function Header() {
  return (
    <header className="mb-10 w-full">
      <Link href="/">
        <div className="relative rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer overflow-hidden max-w-4xl mx-auto bg-[#ff0055] border-t-[3px] border-white/40 border-l-[3px] border-white/20 border-b-[10px] border-r-[5px] border-[#b3003b] shadow-[0_15px_30px_rgba(233,30,99,0.5)] transition-transform active:scale-95 group">
          {/* Subtle top reflection */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

          {/* Outer glow aura behind the header */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff007f] to-[#ff007f] rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 -z-10 pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
             <div className="text-white font-black text-2xl md:text-3xl tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
               ESCAPE <span className="font-bold text-white/80 text-lg uppercase tracking-[0.2em] pl-1 border-l-2 border-white/30 ml-2">AI DEBATE</span>
             </div>
          </div>
          <div className="relative z-10 text-[10px] md:text-xs font-display font-bold text-white uppercase tracking-[0.25em] text-center md:text-right drop-shadow-sm">
            PRESS ESCAPE, SHAPE YOUR MIND
          </div>
        </div>
      </Link>
    </header>
  );
}
