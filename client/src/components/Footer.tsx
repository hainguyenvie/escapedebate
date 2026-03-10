export function Footer() {
  return (
    <footer className="w-full mt-12 mb-8 relative z-10 transition-colors duration-300">
      <div className="relative rounded-[24px] rounded-tl-none p-6 lg:p-10 bg-white/60 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-white/80 backdrop-blur-xl flex flex-col items-center">
        {/* Folder Tab */}
        <div className="absolute -top-[44px] left-[-1px] h-[48px] px-6 lg:px-8 bg-white/60 border-t border-l border-r border-white/80 backdrop-blur-xl rounded-t-[20px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 pt-2">
          <span className="text-xs lg:text-sm font-black text-slate-700 uppercase tracking-widest">CTRL panel</span>
          <div className="h-0.5 w-8 lg:w-16 bg-slate-300" />
        </div>
        
        <div className="mt-10 lg:mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 w-full">
          {/* VỀ CHÚNG TÔI */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-lg lg:text-xl uppercase tracking-widest text-slate-800">
              VỀ CHÚNG TÔI
            </h3>
            {/* Screen effect box */}
            <div className="bg-white/90 rounded-[16px] p-6 shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_2px_10px_rgba(255,255,255,0.8)] border border-slate-200">
              <p className="text-sm md:text-base leading-relaxed text-slate-600 font-semibold md:pr-4">
                Escape AI Debate là nền tảng tiên phong kết hợp trí tuệ nhân tạo để rèn luyện tư duy phản biện. 
                Sứ mệnh của dự án là giúp người trẻ phá vỡ "phòng hồi thanh" (echo chamber), khai phóng góc nhìn 
                đa chiều thông qua các cuộc tranh biện logic.
              </p>
            </div>
          </div>
          
          {/* LIÊN HỆ */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-lg lg:text-xl uppercase tracking-widest text-slate-800">
              LIÊN HỆ
            </h3>
            <div className="space-y-4">
              {/* Facebook Button */}
              <a className="cyber-key block w-full h-[4.5rem]" href="https://www.facebook.com/escape26.st?locale=vi_VN" target="_blank" rel="noopener noreferrer">
                <div className="cyber-key-top !inset-[3px_5px_10px_5px] !flex-row !justify-start gap-4 px-4 h-auto">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#E91E63]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Facebook</p>
                    <p className="text-sm font-bold text-slate-700 truncate normal-case">ESCAPE - Press Escape Shape Your Mind</p>
                  </div>
                </div>
              </a>
              
              {/* Email Button */}
              <a className="cyber-key block w-full h-[4.5rem]" href="mailto:escape.echochamber@gmail.com">
                <div className="cyber-key-top !inset-[3px_5px_10px_5px] !flex-row !justify-start gap-4 px-4 h-auto">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-700 truncate normal-case">escape.echochamber@gmail.com</p>
                  </div>
                </div>
              </a>

              {/* Phone Button */}
              <div className="cyber-key block w-full h-[4.5rem] cursor-default active:transform-none active:shadow-[0px_14px_0px_0px_#94a3b8,0px_25px_30px_rgba(0,0,0,0.3),inset_0px_2px_2px_rgba(255,255,255,1),inset_2px_0px_2px_rgba(255,255,255,0.5),inset_-2px_0px_2px_rgba(0,0,0,0.1)]">
                <div className="cyber-key-top !inset-[3px_5px_10px_5px] !flex-row !justify-start gap-4 px-4 h-auto">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Số điện thoại</p>
                    <p className="text-sm font-bold text-slate-700 truncate normal-case">0359391555 - Đặng Việt Tùng</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Pink Footer Bottom inside the panel */}
        <div className="mt-12 bg-gradient-to-r from-[#E91E63] via-[#ff4081] to-[#E91E63] w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] h-[4rem] flex items-center justify-center -mb-6 lg:-mb-10 rounded-b-[24px] shadow-inner">
          <div className="text-center text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#ffe4ed] font-bold drop-shadow-md">
            © 2026 ESCAPE AI DEBATE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
}
