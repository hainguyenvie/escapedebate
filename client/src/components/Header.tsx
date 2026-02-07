import { Link } from "wouter";

export function Header() {
  return (
    <header className="w-full py-6 px-4 md:px-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="group cursor-pointer">
           <div className="flex items-center gap-1">
             <span className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tighter group-hover:scale-105 transition-transform">
               ESCAPE
             </span>
             <span className="text-2xl md:text-3xl font-display font-light text-slate-800 tracking-tight">
               | AI DEBATE
             </span>
           </div>
           <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-slate-400 mt-1 uppercase pl-1">
             Press Escape, Shape Your Mind
           </p>
        </Link>
      </div>
    </header>
  );
}
