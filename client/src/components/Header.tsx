import { Link } from "wouter";

export function Header() {
  return (
    <header className="mb-12">
      <Link href="/">
        <div className="relative rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl cursor-pointer overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/headerBackground.jpg)' }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-2">
            <img
              src="/images/Logo.png"
              alt="ESCAPE AI DEBATE"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>
          <div className="relative z-10 text-[10px] md:text-xs font-display font-bold text-white/80 uppercase tracking-widest text-center md:text-right">
            PRESS ESCAPE, SHAPE YOUR MIND
          </div>
        </div>
      </Link>
    </header>
  );
}
