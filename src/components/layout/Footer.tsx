export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-100 bg-white mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          © 2026 skybooplan.com · Vse cene so informativne.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Zasebnost</a>
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Pogoji</a>
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Kontakt</a>
        </div>
      </div>
    </footer>
  )
}
