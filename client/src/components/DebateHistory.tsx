import { useState } from "react";
import { useDebates, useDeleteDebate, useRateDebate } from "@/hooks/use-debates";
import { Link } from "wouter";
import { Trash2, ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export function DebateHistory() {
  const { data: debates, isLoading } = useDebates();
  const deleteDebate = useDeleteDebate();
  const rateDebate = useRateDebate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [ratingDebateId, setRatingDebateId] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [rating, setRating] = useState(0);

  const handleDelete = (e: React.MouseEvent, debateId: number, topic: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling

    if (window.confirm(`Bạn có chắc muốn xóa cuộc tranh luận "${topic}"?`)) {
      deleteDebate.mutate(debateId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-primary/5 rounded-xl animate-pulse border border-primary/10" />
        ))}
      </div>
    );
  }

  if (!debates || debates.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-b-xl border-2 border-primary border-t-0">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>Chưa có cuộc tranh luận nào. Hãy là người đầu tiên!</p>
      </div>
    );
  }

  // Sort by newest first
  const sortedDebates = [...debates].sort(
    (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  );

  const visibleDebates = isExpanded ? sortedDebates : sortedDebates.slice(0, 5);

  return (
    <div className="border-2 border-primary rounded-b-xl p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm space-y-5">
      {visibleDebates.map((debate) => (
        <div key={debate.id} className="block relative group mt-4">
          <Link href={`/debate/${debate.id}`}>
            <div className="relative bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/10 flex items-center justify-between hover:bg-primary/10 transition-colors cursor-pointer opacity-90 hover:opacity-100">

              {/* TAG RATE STATUS */}
              {debate.current_round < 5 ? (
                <div className="absolute -top-3 left-6 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap z-10 transition-transform group-hover:-translate-y-0.5">
                  Chưa xong
                </div>
              ) : debate.rating ? (
                <div className="absolute -top-3 left-6 bg-orange-50 border border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 px-3 py-1 rounded-full shadow-sm flex items-center gap-0.5 whitespace-nowrap z-10 transition-transform group-hover:-translate-y-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < debate.rating! ? "fill-orange-400 text-orange-400 drop-shadow-sm" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-600"}`} />
                  ))}
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
                  className="absolute -top-3 left-6 bg-primary text-white border border-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-transform whitespace-nowrap z-20"
                >
                  Đánh giá
                </button>
              )}

              <div className="flex items-center gap-4 flex-1 pr-2">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                    {debate.topic}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, debate.id, debate.topic)}
                  disabled={deleteDebate.isPending}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Xóa cuộc tranh luận"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Arrow icon */}
                <svg
                  className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      ))}

      {sortedDebates.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 text-primary font-bold uppercase tracking-wider text-sm hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
        >
          {isExpanded ? (
            <>
              Thu gọn <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Xem thêm ({sortedDebates.length - 5}) <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
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
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border border-slate-100 dark:border-slate-800"
            >
              <button
                onClick={() => setRatingDebateId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  <h3 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 leading-tight">
                    Bạn có thích<br />trải nghiệm này?
                  </h3>
                  <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm px-2">
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
                              : "fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8 pt-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 fill-green-500 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Cảm ơn bạn!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chúng tôi đã ghi nhận đánh giá<br /><span className="font-bold text-slate-700 dark:text-slate-300">{rating} sao</span> của bạn.</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
