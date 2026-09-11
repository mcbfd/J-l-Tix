'use client';

import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA } from '@/lib/utils/format';
import { StatCard } from '@/components/ui/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LiveScansFeed } from '@/components/dashboard/LiveScansFeed';
import Link from 'next/link';
import { Plus, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { getDashboardKPIs } = useJeltixStore();
  const kpis = getDashboardKPIs();

  return (
    <div className="flex flex-col w-full gap-8">
      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Revenu Total"
          value={formatFCFA(kpis.totalRevenue)}
          unit="FCFA"
          growth={kpis.revenueGrowth}
          iconName="payments"
          variant="primary"
        />

        <StatCard
          title="Billets Vendus"
          value={kpis.totalTicketsSold.toLocaleString('fr-FR')}
          growth={kpis.ticketsGrowth}
          iconName="confirmation_number"
          variant="tertiary"
        />

        <StatCard
          title="Événements Actifs"
          value={kpis.activeEventsCount}
          iconName="event"
          variant="primary"
        />

        <StatCard
          title="Scans Réussis"
          value={kpis.successfulScansCount.toLocaleString('fr-FR')}
          tag="Aujourd'hui"
          iconName="qr_code_scanner"
          variant="tertiary"
        />
      </div>

      {/* Analytics & Live Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="lg:col-span-1">
          <LiveScansFeed />
        </div>
      </div>

      {/* Quick Action Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* New Event Quick Action */}
        <div className="bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs flex flex-col justify-between group overflow-hidden relative min-h-[190px] border border-slate-200/90 dark:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0038A8]/10 text-[#0038A8] dark:bg-white/10 dark:text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Créer un Nouvel Événement</h3>
              <p className="text-xs text-slate-500 dark:text-white/70 mt-1 leading-relaxed">
                Configurez un match, un festival ou combat de lutte avec la tarification et les quotas de billets.
              </p>
            </div>
          </div>
          <div className="relative z-10 text-right">
            <Link
              href="/events/new"
              prefetch={true}
              className="bg-[#0038A8] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs hover:bg-[#002D8C] active:scale-95 transition-all w-full md:w-auto inline-flex items-center justify-center gap-2"
            >
              <span>Créer Événement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Manage Organizers / Users Quick Action */}
        <div className="bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs flex flex-col justify-between group overflow-hidden relative min-h-[190px] border border-slate-200/90 dark:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-bl from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-on-surface">Gestion Opérateurs & Rôles</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Invitez des contrôleurs pour les portes, gérez les vendeurs de guichet et suivez les accès.
              </p>
            </div>
          </div>
          <div className="relative z-10 text-right">
            <Link
              href="/users"
              prefetch={true}
              className="bg-surface-container-highest text-on-surface font-bold text-xs px-5 py-3 rounded-xl hover:bg-surface-variant active:scale-95 transition-all w-full md:w-auto inline-flex items-center justify-center gap-2 border border-outline-variant/50"
            >
              <span>Gérer les Équipes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
