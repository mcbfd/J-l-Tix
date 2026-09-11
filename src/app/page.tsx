'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA, formatDateFrench, formatDateWithDay } from '@/lib/utils/format';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Smartphone,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Ticket as TicketIcon,
  Store,
  Users,
  CheckCircle2,
  Filter,
  Flame,
  Award,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Tous les événements', icon: '✨' },
  { id: 'Oscars & Soirées Gala', label: 'Oscars & Galas de Vacances', icon: '🏆' },
  { id: 'Concert / Festival', label: 'Concerts & Festivals', icon: '🎵' },
  { id: 'Théâtre & Humour', label: 'Théâtre & Stand-up', icon: '🎭' },
  { id: 'Football', label: 'Football & Sports', icon: '⚽' },
  { id: 'Lutte Sénégalaise', label: 'Lutte & Combats Tradis', icon: '🥊' },
  { id: 'Basketball', label: 'Basketball D1 / BAL', icon: '🏀' },
];

function CountdownTimer({ targetDateStr }: { targetDateStr: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDateStr) return;
    const targetDate = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = Math.max(0, targetDate - now);

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center font-mono">
      <div className="bg-black/30 rounded-xl p-1.5">
        <p className="text-lg font-black text-[#4EED15]">{timeLeft.days}</p>
        <p className="text-[9px] text-white/60">Jours</p>
      </div>
      <div className="bg-black/30 rounded-xl p-1.5">
        <p className="text-lg font-black text-[#4EED15]">{timeLeft.hours}</p>
        <p className="text-[9px] text-white/60">Heures</p>
      </div>
      <div className="bg-black/30 rounded-xl p-1.5">
        <p className="text-lg font-black text-[#4EED15]">{timeLeft.minutes}</p>
        <p className="text-[9px] text-white/60">Min</p>
      </div>
      <div className="bg-black/30 rounded-xl p-1.5">
        <p className="text-lg font-black text-[#4EED15]">{timeLeft.seconds}</p>
        <p className="text-[9px] text-white/60">Sec</p>
      </div>
    </div>
  );
}


export default function PublicHomePage() {
  const { events } = useJeltixStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');



  useEffect(() => {
    setMounted(true);
  }, []);

  // Prochain événement futur dans le store pour le countdown
  const countdownEvent = useMemo(() => {
    const now = new Date();
    const futureEvents = events
      .filter((e) => e.status === 'PUBLISHED' && new Date(e.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return futureEvents[0] || null;
  }, [events]);



  const filteredEvents = useMemo(() => events.filter((evt) => {
    // Fix: comparaison exacte (===) pour les catégories, not includes()
    const matchesCategory =
      selectedCategory === 'all' || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.locationDetails.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity =
      selectedCity === 'all' ||
      evt.locationDetails.toLowerCase().includes(selectedCity.toLowerCase()) ||
      evt.venue.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesCategory && matchesSearch && matchesCity;
  }), [events, selectedCategory, searchQuery, selectedCity]);

  const featuredEvent = useMemo(() => countdownEvent || events[0] || null, [countdownEvent, events]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface selection:bg-[#4EED15] selection:text-[#002D8C]">
      {/* Public Navigation Header */}
      <PublicHeader />

      {/* Hero Section: Bright & Luminous by Default, Midnight in Dark Mode */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4FC] via-[#F8FAFC] to-[#FFFFFF] dark:from-[#050D1E] dark:via-[#0A1D44] dark:to-[#050D1E] text-slate-900 dark:text-white pt-10 pb-20 md:pt-16 md:pb-24 transition-colors">
        {/* Glow ambient meshes */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0038A8]/10 dark:bg-[#0038A8]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#4EED15]/15 dark:bg-[#4EED15]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
            {/* Top Brand Pill Tag with Exact Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/10 shadow-sm border border-slate-200 dark:border-white/15 text-xs font-black tracking-wide uppercase text-slate-800 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-[#2CA808] dark:bg-[#4EED15] animate-ping" />
              <span className="text-[#0038A8] dark:text-[#4EED15]">Jël Tix</span>
              <span className="text-slate-300 dark:text-white/40">•</span>
              <span className="text-slate-700 dark:text-white/90">Plateforme Multi-Événements & Billetterie Unifiée</span>
            </div>

            {/* Main Catchphrase & Hero H1 */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#002D8C] dark:text-white">
              Saisissez. Réservez.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2CA808] via-[#4EED15] to-[#0038A8] dark:from-[#4EED15] dark:via-[#75F94B] dark:to-[#36C80A] drop-shadow-sm">
                Profitez.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-white/80 max-w-3xl font-medium leading-relaxed">
              Vos billets pour <strong className="text-slate-900 dark:text-white">Oscars de Vacances</strong>, <strong className="text-slate-900 dark:text-white">Concerts</strong>, <strong className="text-slate-900 dark:text-white">Soirées Gala</strong>, <strong className="text-slate-900 dark:text-white">Théâtre</strong> & <strong className="text-slate-900 dark:text-white">Matchs Sportifs</strong> en 30 secondes avec <strong className="text-slate-900 dark:text-white">Wave</strong>, <strong className="text-slate-900 dark:text-white">Orange Money</strong> ou <strong className="text-slate-900 dark:text-white">Free Money</strong>.
            </p>

            {/* Smart Search Bar */}
            <div className="w-full max-w-2xl mt-4">
              <div className="relative flex items-center bg-white dark:bg-[#0B1936] rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-white/20">
                <Search className="w-6 h-6 text-[#0038A8] dark:text-[#4EED15] ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un match, un artiste, un festival, une arène..."
                  className="w-full px-3 py-2.5 text-slate-900 dark:text-white text-sm md:text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#0038A8] to-[#0D52D6] hover:from-[#002D8C] hover:to-[#0B4FD8] text-white font-bold text-xs sm:text-sm shrink-0 transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Trouver</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Trust Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-8 mt-4 border-t border-slate-200 dark:border-white/10 text-left">
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider">Billets Émis</p>
                <p className="text-xl sm:text-2xl font-black text-[#002D8C] dark:text-white mt-0.5">68 450+</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider">Sécurité Anti-Fraude</p>
                <p className="text-xl sm:text-2xl font-black text-[#2CA808] dark:text-[#4EED15] mt-0.5">100% Unique</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider">Vitesse de Scan</p>
                <p className="text-xl sm:text-2xl font-black text-[#002D8C] dark:text-white mt-0.5">&lt; 1 Sec/Porte</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider">Paiements Locaux</p>
                <p className="text-xl sm:text-2xl font-black text-[#002D8C] dark:text-white mt-0.5">Wave / OM / Free</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Highlight Spotlight Card with Live Match Countdown */}
      {featuredEvent && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 -mt-8 relative z-20 w-full">
          <div className="bg-gradient-to-r from-[#0038A8] via-[#0B4FD8] to-[#002878] rounded-3xl p-6 sm:p-8 shadow-2xl text-white border border-white/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Event Image */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-lg h-64 lg:h-80 group">
                <Image
                  src={featuredEvent.bannerImage}
                  alt={featuredEvent.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#4EED15] text-[#002D8C] font-black text-xs uppercase tracking-wider shadow-md">
                  🔥 Événement Vedette
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs" suppressHydrationWarning>
                  {featuredEvent.category}
                </div>
              </div>

              {/* Event Info & Booking */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4EED15] font-mono font-bold" suppressHydrationWarning>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateWithDay(featuredEvent.startDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredEvent.timeString}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-2 leading-tight tracking-tight" suppressHydrationWarning>
                    {featuredEvent.title}
                  </h2>

                  <p className="text-white/80 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed" suppressHydrationWarning>
                    {featuredEvent.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium mt-3" suppressHydrationWarning>
                    <MapPin className="w-4 h-4 text-[#4EED15]" />
                    <span suppressHydrationWarning>{featuredEvent.venue} ({featuredEvent.locationDetails})</span>
                  </div>
                </div>

                {/* Countdown Timer — dynamique sur le prochain événement futur */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  {countdownEvent ? (
                    <>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-white/70 mb-2 font-bold">
                        Coup d'envoi dans :
                      </p>
                      <CountdownTimer targetDateStr={countdownEvent.startDate} />
                    </>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="material-symbols-outlined text-[18px] text-white/60">event_busy</span>
                      <p className="text-xs font-mono text-white/70">Événement terminé — Prochaine édition bientôt</p>
                    </div>
                  )}
                </div>

                {/* Pricing & CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/15">
                  <div>
                    <span className="text-[11px] text-white/70 uppercase font-mono">À partir de</span>
                    <p className="text-2xl sm:text-3xl font-black text-[#4EED15]">
                      {formatFCFA(featuredEvent.ticketTypes[0]?.price || 300)}{' '}
                      <span className="text-xs font-normal text-white">FCFA</span>
                    </p>
                  </div>

                  <Link
                    href={`/events/${featuredEvent.slug}`}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#4EED15] hover:bg-[#42D40F] text-[#002D8C] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#4EED15]/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    <TicketIcon className="w-5 h-5" />
                    <span>Réserver mes places (Wave / OM)</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Events Catalog Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 w-full space-y-8">
        {/* Category Pills & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h3 className="text-2xl font-black text-on-surface">Tous les Événements Disponibles</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Trouvez vos places et réservez instantanément avec votre numéro de téléphone.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#0038A8] text-white shadow-md'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const minPrice = Math.min(...evt.ticketTypes.map((t) => t.price));
            const fillRate = Math.round((evt.soldCapacity / evt.totalCapacity) * 100);

            return (
              <div
                key={evt.id}
                className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Banner Thumbnail */}
                <div className="relative h-36 w-full overflow-hidden rounded-t-2xl shrink-0">
                  <Image
                    src={evt.bannerImage}
                    alt={evt.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs">
                    {evt.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#4EED15] text-[#002D8C] font-black text-[10px] uppercase tracking-wider font-mono shadow-md">
                    {fillRate}% Vendu
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateFrench(evt.startDate)}</span>
                      <span>•</span>
                      <span>{evt.timeString}</span>
                    </div>

                    <h4 className="text-lg font-black text-on-surface group-hover:text-primary transition-colors leading-tight">
                      {evt.title}
                    </h4>

                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{evt.venue} ({evt.locationDetails})</span>
                    </p>
                  </div>

                  {/* Stock Gauge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>Remplissage</span>
                      <span>{evt.soldCapacity.toLocaleString('fr-FR')} / {evt.totalCapacity.toLocaleString('fr-FR')} places</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0038A8] to-[#4EED15] rounded-full transition-all"
                        style={{ width: `${Math.min(100, fillRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                    <div>
                      <span className="text-[10px] font-mono text-on-surface-variant uppercase">Dès</span>
                      <p className="text-lg font-black text-primary font-mono">
                        {formatFCFA(minPrice)}{' '}
                        <span className="text-xs font-normal text-on-surface-variant">FCFA</span>
                      </p>
                    </div>

                    <Link
                      href={`/events/${evt.slug}`}
                      className="px-4 py-2 rounded-xl bg-[#0038A8] hover:bg-[#002D8C] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                    >
                      <span>Réserver</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
