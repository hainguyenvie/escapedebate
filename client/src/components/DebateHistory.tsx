import { useState } from "react";
import { useDebates, useDeleteDebate, useRateDebate } from "@/hooks/use-debates";
import { Link } from "wouter";
import { Trash2, Star, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export function DebateHistory() {
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
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedDebates = debates
    ? [...debates].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    : [];

  const maxInitial = 5;
  const visibleDebates = isExpanded ? sortedDebates : sortedDebates.slice(0, maxInitial);

  const renderRow = (debate: any) => (
    <div key={debate.id} className="relative group">
      <Link href={`/debate/${debate.id}`}>
        <div className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3 rounded-2xl bg-pink-50 hover:bg-pink-100 border border-pink-100 hover:border-pink-200 transition-all duration-150 cursor-pointer">

          {/* Icon */}
          <div className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Topic */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate normal-case">
              {debate.topic}
            </p>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex items-center gap-1.5 md:gap-3">
            {debate.current_round < 5 ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Chưa xong
              </span>
            ) : debate.rating ? (
              <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                {debate.rating}<Star className="w-2.5 h-2.5 fill-orange-400" />
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRatingDebateId(debate.id);
                  setRating(0);
                  setHoverStar(0);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-[#E91E63] bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded-full transition-colors z-20"
              >
                Đánh giá
              </button>
            )}

            {/* Delete - hover only */}
            <button
              onClick={(e) => handleDelete(e, debate.id, debate.topic)}
              disabled={deleteDebate.isPending}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="relative w-full">
      {/* Inner white panel */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-2.5 md:p-6 min-h-[160px]">
        {sortedDebates.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="font-black uppercase tracking-[0.25em] text-slate-400 text-base">
              CHƯA CÓ LỊCH SỬ
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleDebates.map(renderRow)}
          </div>
        )}
      </div>

      {/* Expand/Collapse */}
      {sortedDebates.length > maxInitial && (
        <div className="w-full h-8 flex items-center justify-center mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold text-xs tracking-widest uppercase transition-all"
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

      {/* Rating Popup */}
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
