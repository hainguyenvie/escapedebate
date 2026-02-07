import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404</h1>
          <p className="text-slate-500 mb-8">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          
          <Link href="/" className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
