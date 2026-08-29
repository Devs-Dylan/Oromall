import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-4 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Brand & Badge */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-amber-500 text-black font-black text-[10px] flex items-center justify-center">OM</span>
            OroMall
          </span>
          <span className="text-[11px] text-slate-500">© {new Date().getFullYear()}</span>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> Certifié MoMo
          </span>
        </div>

        {/* Essential Navigation */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-300">
          <Link to="/" className="hover:text-amber-400 transition-colors">Boutiques</Link>
          <Link to="/housing" className="hover:text-amber-400 transition-colors">Logements</Link>
          <Link to="/map" className="hover:text-amber-400 transition-colors">Carte</Link>
          <Link to="/seller/onboarding" className="text-amber-400 hover:underline">Vendre</Link>
          <Link to="/faq" className="hover:text-amber-400 transition-colors">Aide</Link>
        </div>

        {/* Direct Contact & MoMo */}
        <div className="text-[11px] font-mono text-slate-400">
          MTN: <span className="text-slate-200 font-bold">680195221</span> • OM: <span className="text-slate-200 font-bold">691576677</span>
        </div>

      </div>
    </footer>
  )
}
