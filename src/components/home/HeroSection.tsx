'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useJeltixStore } from '@/lib/store/jeltix-store';

// Le Hero est Client Component uniquement pour la search bar interactive
// et les stats qui nécessitent un compteur animé.
// Le SSR rendrait la section entière vide avec `if(!mounted) return null`.
// Ici on utilise suppressHydrationWarning sur les éléments qui peuvent différer.

export function HeroSection() {
  // Les stats sont statiques — pas besoin de store
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4FC] via-[#F8FAFC] to-[#FFFFFF] dark:from-[#050D1E] dark:via-[#0A1D44] dark:to-[#050D1E] text-slate-900 dark:text-white pt-10 pb-20 md:pt-16 md:pb-24 transition-colors">
      {/* Glow ambient meshes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0038A8]/10 dark:bg-[#0038A8]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#4EED15]/15 dark:bg-[#4EED15]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          {/* Top Brand Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/10 shadow-sm border border-slate-200 dark:border-white/15 text-xs font-black tracking-wide uppercase text-slate-800 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-[#2CA808] dark:bg-[#4EED15] animate-ping" />
            <span className="text-[#0038A8] dark:text-[#4EED15]">Jël Tix</span>
            <span className="text-slate-300 dark:text-white/40">•</span>
            <span className="text-slate-700 dark:text-white/90">Plateforme Multi-Événements &amp; Billetterie Unifiée</span>
          </div>

          {/* Main H1 */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#002D8C] dark:text-white">
            Saisissez. Réservez.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2CA808] via-[#4EED15] to-[#0038A8] dark:from-[#4EED15] dark:via-[#75F94B] dark:to-[#36C80A] drop-shadow-sm">
              Profitez.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-white/80 max-w-3xl font-medium leading-relaxed">
            Vos billets pour <strong className="text-slate-900 dark:text-white">Oscars de Vacances</strong>,{' '}
            <strong className="text-slate-900 dark:text-white">Concerts</strong>,{' '}
            <strong className="text-slate-900 dark:text-white">Soirées Gala</strong>,{' '}
            <strong className="text-slate-900 dark:text-white">Théâtre</strong> &amp;{' '}
            <strong className="text-slate-900 dark:text-white">Matchs Sportifs</strong>{' '}
            en 30 secondes avec <strong className="text-slate-900 dark:text-white">Wave</strong>,{' '}
            <strong className="text-slate-900 dark:text-white">Orange Money</strong> ou{' '}
            <strong className="text-slate-900 dark:text-white">Free Money</strong>.
          </p>

          {/* Smart Search Bar — scroll vers le catalogue */}
          <HeroSearchBar />

          {/* Trust Metrics Bar — statiques, rendus immédiatement */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-8 mt-4 border-t border-slate-200 dark:border-white/10 text-left">
            {[
              { label: 'Billets Émis', value: '68 450+', color: 'text-[#002D8C] dark:text-white' },
              { label: 'Sécurité Anti-Fraude', value: '100% Unique', color: 'text-[#2CA808] dark:text-[#4EED15]' },
              { label: 'Vitesse de Scan', value: '< 1 Sec/Porte', color: 'text-[#002D8C] dark:text-white' },
              { label: 'Paiements Locaux', value: 'Wave / OM / Free', color: 'text-[#002D8C] dark:text-white' },
            ].map((metric) => (
              <div key={metric.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider">{metric.label}</p>
                <p className={`text-xl sm:text-2xl font-black mt-0.5 ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Search Bar — Client Component minimal ────────────────────────────────────
function HeroSearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    // Scroll vers le catalogue et déclenche la recherche via URL state
    const catalog = document.getElementById('event-catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
    // On dispatch un event custom que EventCatalog écoute
    window.dispatchEvent(new CustomEvent('jeltix-search', { detail: { query } }));
  };

  return (
    <div className="w-full max-w-2xl mt-4">
      <div className="relative flex items-center bg-white dark:bg-[#0B1936] rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-white/20">
        <Search className="w-6 h-6 text-[#0038A8] dark:text-[#4EED15] ml-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher un match, un artiste, un festival, une arène..."
          className="w-full px-3 py-2.5 text-slate-900 dark:text-white text-sm md:text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#0038A8] to-[#0D52D6] hover:from-[#002D8C] hover:to-[#0B4FD8] text-white font-bold text-xs sm:text-sm shrink-0 transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <span>Trouver</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
