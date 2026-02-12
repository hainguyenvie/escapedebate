import { useState } from "react";
import { useDebates, useDeleteDebate } from "@/hooks/use-debates";
import { Link } from "wouter";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

export function DebateHistory() {
  const { data: debates, isLoading } = useDebates();
  const deleteDebate = useDeleteDebate();
  const [isExpanded, setIsExpanded] = useState(false);

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
        <div key={debate.id} className="block relative group">
          <Link href={`/debate/${debate.id}`}>
            <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/10 flex items-center justify-between hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 leading-tight pr-12 line-clamp-2">
                  {debate.topic}
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
    </div>
  );
}
