export function Footer() {
  return (
    <footer className="w-full mt-12 mb-8 relative z-10 transition-colors duration-300">
      {/* Outer — dùng đúng class pink-board + !rounded-tl-none giống LỊCH SỬ DEBATE */}
      <div className="pink-board w-full relative !rounded-tl-none">
        {/* Texture overlay — y hệt LỊCH SỬ DEBATE */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] rounded-[28px] !rounded-tl-none pointer-events-none mix-blend-overlay" />

        {/* Folder Tab — y hệt LỊCH SỬ DEBATE */}
        <div className="absolute -top-[44px] left-[-1px] h-[48px] px-6 lg:px-8 bg-[#E91E63] border-t border-l border-r border-[#E91E63] shadow-[0_-5px_15px_rgba(233,30,99,0.2)] rounded-t-[20px] flex items-center justify-center gap-2 pt-2 z-20">
          <span className="text-xs lg:text-sm font-black text-white/90 uppercase tracking-widest drop-shadow-sm">VỀ CHÚNG TÔI</span>
          <div className="h-0.5 w-8 lg:w-16 bg-white/40" />
        </div>

        {/* Inner white panel — y hệt DebateHistory */}
        <div className="relative z-10 w-full h-full">
          <div className="bg-white rounded-[20px] border border-slate-100 p-4 md:p-6 min-h-[200px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 w-full">

              {/* About text */}
              <div className="flex items-center">
                <p className="text-sm md:text-base leading-relaxed text-slate-600 font-semibold">
                  Escape AI Debate là nền tảng tiên phong kết hợp trí tuệ nhân tạo để rèn luyện tư duy phản biện.
                  Sứ mệnh của dự án là giúp người trẻ phá vỡ <strong className="whitespace-nowrap">"Echo Chamber (Buồng vọng thông tin)"</strong>, khai phóng góc nhìn
                  đa chiều thông qua các cuộc tranh biện logic.
                </p>
              </div>

              {/* LIÊN HỆ */}
              <div className="space-y-3">
                <h3 className="font-display font-black text-base lg:text-lg uppercase tracking-widest text-slate-800">
                  LIÊN HỆ
                </h3>

                {/* Facebook */}
                <a
                  className="block w-full h-[4.5rem] rounded-xl border border-[#2d7a5a]/40 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a5c42 0%, #27ae72 100%)' }}
                  href="https://www.facebook.com/escape26.st?locale=vi_VN"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-full h-full flex flex-row items-center gap-4 px-4">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                      <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">Facebook</p>
                      <p className="text-[10px] sm:text-[11px] md:text-sm font-bold text-white truncate whitespace-nowrap normal-case">ESCAPE - Press Escape, Shape Your Mind</p>
                    </div>
                  </div>
                </a>

                {/* Email */}
                <a
                  className="block w-full h-[4.5rem] rounded-xl border border-[#2d7a5a]/40 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a5c42 0%, #27ae72 100%)' }}
                  href="mailto:escape.echochamber@gmail.com"
                >
                  <div className="w-full h-full flex flex-row items-center gap-4 px-4">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                      <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">Email</p>
                      <p className="text-[10px] sm:text-[11px] md:text-sm font-bold text-white truncate whitespace-nowrap normal-case">escape.echochamber@gmail.com</p>
                    </div>
                  </div>
                </a>

                {/* Phone */}
                <div
                  className="block w-full h-[4.5rem] rounded-xl border border-[#2d7a5a]/40 overflow-hidden cursor-default"
                  style={{ background: 'linear-gradient(135deg, #1a5c42 0%, #27ae72 100%)' }}
                >
                  <div className="w-full h-full flex flex-row items-center gap-4 px-4">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                      <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">Số điện thoại</p>
                      <p className="text-[10px] sm:text-[11px] md:text-sm font-bold text-white truncate whitespace-nowrap normal-case">0359391555 - Đặng Viết Tùng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright bar — căn giữa dọc */}
          <div className="w-full h-8 flex items-center justify-center mt-3">
            <div className="text-center text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/70 font-bold">
              © 2026 ESCAPE AI DEBATE. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
