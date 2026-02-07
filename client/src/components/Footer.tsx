import { Facebook, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-2xl font-display font-bold text-primary mb-2">ESCAPE</h3>
          <p className="text-slate-400 text-sm">Shape your mind.</p>
        </div>
        
        <div className="flex flex-col gap-2 items-center md:items-end">
          <h4 className="font-display font-semibold mb-2">LIÊN HỆ</h4>
          <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Facebook className="w-4 h-4" /> Facebook Fanpage
          </a>
          <a href="mailto:contact@escape.vn" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Mail className="w-4 h-4" /> contact@escape.vn
          </a>
          <a href="tel:+84123456789" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Phone className="w-4 h-4" /> 0123 456 789
          </a>
        </div>
      </div>
    </footer>
  );
}
