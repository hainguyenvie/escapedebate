import { useDebates } from "@/hooks/use-debates";
import { Link } from "wouter";
import { Clock, ArrowRight, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function DebateHistory() {
  const { data: debates, isLoading } = useDebates();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!debates || debates.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Chưa có cuộc tranh luận nào. Hãy là người đầu tiên!</p>
      </div>
    );
  }

  // Sort by newest first
  const sortedDebates = [...debates].sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedDebates.map((debate) => (
        <Link key={debate.id} href={`/debate/${debate.id}`} className="block group">
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                  debate.side === 'support' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {debate.side === 'support' ? 'Ủng hộ' : 'Phản đối'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(debate.createdAt!), { addSuffix: true, locale: vi })}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                {debate.topic}
              </h3>
            </div>
            
            <div className="mt-4 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Xem lại <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
