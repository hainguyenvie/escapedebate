import { useState, ReactNode } from "react";
import { useDebates, useDeleteDebate, useRateDebate } from "@/hooks/use-debates";
import { Link } from "wouter";
import { Trash2, Star, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface DebateHistoryProps {
  centerContent?: ReactNode;
}

export function DebateHistory({ centerContent }: DebateHistoryProps) {
  const { data: debates, isLoading } = useDebates();
  const deleteDebate = useDeleteDebate();
  const rateDebate = useRateDebate();
  const [ratingDebateId, setRatingDebateId] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [rating, setRating] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = (e: React.MouseEvent, debateId: number, topic: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (window.confirm(`Bạn có chắc muốn xóa cuộc tranh luận "${topic}"?`)) {
      deleteDebate.mutate(debateId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 w-full">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedDebates = debates 
    ? [...debates].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    : [];

  const maxInitial = 6;
  const initialLeft = sortedDebates.slice(0, 3);
  const initialRight = sortedDebates.slice(3, 6);

  const extraDebates = isExpanded ? sortedDebates.slice(6) : [];
  
  const leftDebates = [...initialLeft, ...extraDebates.filter((_, i) => i % 3 === 0)];
  const centerDebates = extraDebates.filter((_, i) => i % 3 === 1);
  const rightDebates = [...initialRight, ...extraDebates.filter((_, i) => i % 3 === 2)];

  const renderDebateItem = (debate: any) => (
    <div key={debate.id} className="relative group w-full max-w-sm mx-auto mb-4">
      <Link href={`/debate/${debate.id}`}>
        <div className="cyber-key w-full h-[5.5rem]">
          <div className="cyber-key-top !flex-row !justify-between !inset-[5px_6px_12px_6px] px-4">
            {/* Status Label */}
            {debate.current_round < 5 ? (
              <div className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow z-10">
                Chưa xong
              </div>
            ) : debate.rating ? (
              <div className="absolute -top-3 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-0.5 z-10">
                {debate.rating} <Star className="w-2.5 h-2.5 fill-white" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRatingDebateId(debate.id);
                  setRating(0);
                  setHoverStar(0);
                }}
                className="absolute -top-3 left-4 bg-[#E91E63] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow z-20 hover:scale-105 transition-transform"
              >
                Đánh giá
              </button>
            )}

            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
              <div className="w-8 h-8 shrink-0 rounded-full border border-slate-300 flex items-center justify-center bg-white/50 shadow-inner">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xs md:text-sm font-bold text-slate-700 leading-snug line-clamp-2 text-left normal-case">
                {debate.topic}
              </div>
            </div>

            {/* Delete action visible on hover */}
            <button
              onClick={(e) => handleDelete(e, debate.id, debate.topic)}
              disabled={deleteDebate.isPending}
              className="opacity-0 group-hover:opacity-100 absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-100/90 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 z-10 shadow-sm"
              title="Xóa cuộc tranh luận"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="relative w-full">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-4 lg:gap-8 w-full">
        
        {/* Left Column */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 items-center md:items-end md:pt-6">
          {leftDebates.length > 0 ? (
            leftDebates.map(renderDebateItem)
          ) : (
             <div className="text-white/60 text-sm italic w-full max-w-sm text-center md:text-right pt-4">Chưa có tranh luận...</div>
          )}
        </div>

        {/* Center Main Action */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 items-center justify-start z-10 relative mt-8 md:mt-0">
          <div className="w-full mb-0 md:mt-2">
            {centerContent}
          </div>
          {centerDebates.length > 0 && centerDebates.map(renderDebateItem)}
        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 items-center md:items-start md:pt-14">
           {rightDebates.length > 0 && rightDebates.map(renderDebateItem)}
        </div>

      </div>

      {/* Expand/Collapse Button */}
      {sortedDebates.length > maxInitial && (
        <div className="w-full flex justify-center mt-10 pb-2 relative z-20">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold text-xs md:text-sm tracking-widest uppercase transition-all group"
          >
            <span>{isExpanded ? "Thu gọn lịch sử" : "Xem tất cả lịch sử"}</span>
            <svg 
              className={clsx("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Popup Đánh giá ngoài Homepage */}
      <AnimatePresence>
        {ratingDebateId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setRatingDebateId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6 mt-2">
                <img
                  src="/images/Avatar.png"
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white/20 transform -rotate-3"
                />
              </div>

              {rating === 0 ? (
                <>
                  <h3 className="text-2xl font-black text-center text-slate-800 mb-2 leading-tight">
                    Bạn có thích<br />trải nghiệm này?
                  </h3>
                  <p className="text-center text-slate-500 mb-8 font-medium text-sm px-2">
                    Nhấp vào một ngôi sao để đánh giá trên hệ thống của ESCAPE.
                  </p>

                  <div className="flex justify-center gap-2 mb-8" onMouseLeave={() => setHoverStar(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverStar(star)}
                        onClick={() => {
                          setRating(star);
                          rateDebate.mutate({ id: ratingDebateId, rating: star });
                          setTimeout(() => {
                            setRatingDebateId(null);
                            setRating(0);
                            setHoverStar(0);
                          }, 2000);
                        }}
                        className="transition-transform hover:scale-110 active:scale-90 focus:outline-none"
                      >
                        <Star
                          className={clsx(
                            "w-10 h-10 transition-colors duration-200",
                            (hoverStar || rating) >= star
                              ? "fill-orange-400 text-orange-400 drop-shadow-sm"
                              : "fill-slate-100 text-slate-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8 pt-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 fill-green-500 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Cảm ơn bạn!</h3>
                  <p className="text-slate-500 text-sm font-medium">Chúng tôi đã ghi nhận đánh giá<br /><span className="font-bold text-slate-700">{rating} sao</span> của bạn.</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
