export function Footer() {
  return (
    <footer className="bg-footer-gradient text-white rounded-xl shadow-2xl overflow-hidden">
      <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl uppercase tracking-wider border-b-2 border-white/20 pb-3">
            VỀ CHÚNG TÔI
          </h3>
          <p className="text-base leading-relaxed text-white/90 font-medium">
            Escape AI Debate là nền tảng tiên phong kết hợp trí tuệ nhân tạo để rèn luyện tư duy phản biện.
            Sứ mệnh của dự án là giúp người trẻ phá vỡ "phòng hồi thanh" (echo chamber), khai phóng góc nhìn
            đa chiều thông qua các cuộc tranh biện logic.
          </p>
        </div>
        <div className="space-y-6">
          <h3 className="font-display font-bold text-xl uppercase tracking-wider border-b-2 border-white/20 pb-3">
            LIÊN HỆ
          </h3>
          <div className="space-y-5">
            <a className="flex items-center gap-4 group" href="https://www.facebook.com/profile.php?id=61571981258024" target="_blank" rel="noopener noreferrer">
              <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/50 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">
                  Facebook
                </p>
                <div className="text-sm md:text-base font-semibold group-hover:translate-x-1 transition-transform">
                  <div>ESCAPE -</div>
                  <div>Press Escape Shape Your Mind</div>
                </div>
              </div>
            </a>
            <a className="flex items-center gap-4 group" href="mailto:escape.echochamber@gmail.com">
              <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/50 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">
                  Email
                </p>
                <p className="text-sm md:text-base font-semibold group-hover:translate-x-1 transition-transform">
                  escape.echochamber@gmail.com
                </p>
              </div>
            </a>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">
                  Số điện thoại
                </p>
                <div className="text-sm md:text-base font-semibold">
                  <div>0359391555</div>
                  <div className="text-xs md:text-sm">Đặng Viết Tùng - Đại diện Dự án</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-8 pb-8">
        <div className="border-t border-white/20 pt-8">
          <div className="text-center text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
            © 2026 ESCAPE AI DEBATE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
}
