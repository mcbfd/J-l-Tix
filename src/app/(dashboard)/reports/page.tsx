'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA } from '@/lib/utils/format';
import {
  fetchPlatformKPIs,
  fetchOrganizerKPIs,
  fetchOrdersForCSV,
  type PlatformKPIs,
  type OrganizerKPIs,
  type RevenueByPaymentMethod,
} from '@/lib/services/analytics.service';
import {
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Ticket,
  ShieldCheck,
  Activity,
  BarChart3,
  Loader2,
} from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-on-surface-variant font-mono uppercase font-bold tracking-wider">
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent ?? '#0038A8'}22` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent ?? '#0038A8' }} />
        </div>
      </div>
      <p
        className="text-2xl font-black font-mono leading-none"
        style={{ color: accent ?? 'var(--color-on-surface)' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function PaymentBar({ item }: { item: RevenueByPaymentMethod }) {
  return (
    <div>
      <div className="flex justify-between font-bold text-xs mb-1">
        <span className="text-on-surface">{item.label}</span>
        <span className="font-mono" style={{ color: item.color }}>
          {item.percentage}% · {formatFCFA(item.total)} FCFA
        </span>
      </div>
      <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${item.percentage}%`, background: item.color }}
        />
      </div>
      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
        {item.count.toLocaleString('fr-FR')} commande{item.count > 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { currentUser } = useJeltixStore();
  const role = currentUser?.role;
  const isAdmin = role === 'SUPER_ADMIN';
  const isOrganizer = role === 'ORGANIZER';

  const [kpis, setKpis] = useState<PlatformKPIs | OrganizerKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadKPIs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        setKpis(await fetchPlatformKPIs());
      } else if (isOrganizer && currentUser?.id) {
        setKpis(await fetchOrganizerKPIs(currentUser.id));
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données analytiques. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isOrganizer, currentUser?.id]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const csvData = await fetchOrdersForCSV(isOrganizer ? currentUser?.id : undefined);
      if (!csvData) {
        alert('Aucune commande à exporter pour le moment.');
        return;
      }
      const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jeltix_rapport_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export. Réessayez.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Not authorized ──────────────────────────────────────────────────────────
  if (!isAdmin && !isOrganizer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-on-surface-variant text-sm">Accès non autorisé.</p>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-on-surface-variant font-mono">
          Chargement des données Supabase…
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <p className="text-sm text-red-500 font-mono">{error ?? 'Données indisponibles.'}</p>
        <button
          onClick={loadKPIs}
          className="text-xs text-primary underline font-bold"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const pKpis = kpis as PlatformKPIs;
  const oKpis = kpis as OrganizerKPIs;
  const revenue = kpis.totalRevenue;
  const commission = kpis.jeltixCommission;
  const net = isAdmin ? pKpis.netToOrganizers : oKpis.netToMe;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">
            Rapports &amp; Audit Financier
          </h1>
          <p className="text-sm text-on-surface-variant">
            Données en temps réel depuis Supabase ·{' '}
            <span className="font-mono">
              Actualisé {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadKPIs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md cursor-pointer disabled:opacity-60"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-[#4EED15]" />
            )}
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenu Brut"
          value={`${formatFCFA(revenue)} FCFA`}
          sub={`${kpis.totalOrders} commande${kpis.totalOrders > 1 ? 's' : ''} complétée${kpis.totalOrders > 1 ? 's' : ''}`}
          accent="#0038A8"
          icon={DollarSign}
        />
        <KpiCard
          label={isAdmin ? 'Commission Jël Tix (3%)' : 'Commission plateforme (3%)'}
          value={`${formatFCFA(commission)} FCFA`}
          accent="#7C3AED"
          icon={BarChart3}
        />
        <KpiCard
          label={isAdmin ? 'Net Organisateurs (97%)' : 'Net à percevoir (97%)'}
          value={`${formatFCFA(net)} FCFA`}
          accent="#4EED15"
          icon={TrendingUp}
        />
        <KpiCard
          label="Panier Moyen / Commande"
          value={`${formatFCFA(kpis.averageBasket)} FCFA`}
          sub={`${kpis.totalTicketsSold.toLocaleString('fr-FR')} billets vendus`}
          accent="#FF7900"
          icon={Ticket}
        />
      </div>

      {/* ── Scans aujourd'hui (badge) ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/30 w-fit">
        <ShieldCheck className="w-5 h-5 text-[#4EED15]" />
        <span className="text-sm font-bold text-on-surface">
          Scans aujourd'hui :{' '}
          <span className="text-[#4EED15] font-mono">
            {kpis.successfulScansToday.toLocaleString('fr-FR')} validés
          </span>
          {isAdmin && (
            <span className="text-on-surface-variant">
              {' '}/ {(pKpis.totalScansToday ?? 0).toLocaleString('fr-FR')} total
            </span>
          )}
        </span>
      </div>

      {/* ── Main 2-column row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods breakdown */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">
              Ventilation Paiements
            </h3>
          </div>
          {kpis.revenueByMethod.length === 0 ? (
            <p className="text-xs text-on-surface-variant font-mono py-4 text-center">
              Aucune commande enregistrée
            </p>
          ) : (
            <div className="space-y-4">
              {kpis.revenueByMethod.map((item) => (
                <PaymentBar key={item.method} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Event */}
        <div className="lg:col-span-2 bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">
              Recettes par Événement
            </h3>
          </div>

          {kpis.revenueByEvent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <BarChart3 className="w-12 h-12 text-outline-variant" />
              <p className="text-sm text-on-surface-variant font-mono">
                Aucun événement avec des ventes pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.revenueByEvent.map((evt) => (
                <div
                  key={evt.eventId}
                  className="p-4 bg-surface rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-on-surface truncate">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {evt.venue} · {evt.ordersCount} commande{evt.ordersCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-primary font-mono">
                      {formatFCFA(evt.totalRevenue)} FCFA
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      {evt.ticketsSold.toLocaleString('fr-FR')} billet
                      {evt.ticketsSold > 1 ? 's' : ''} vendus
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Sales mini-chart (ASCII bars) ─────────────────────────────── */}
      {kpis.dailySales.length > 0 && (
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider font-mono">
              Évolution des Recettes (30 derniers jours)
            </h3>
          </div>
          <div className="flex items-end gap-1 h-24 w-full">
            {(() => {
              const max = Math.max(...kpis.dailySales.map((d) => d.revenue), 1);
              return kpis.dailySales.map((day) => {
                const heightPct = Math.max((day.revenue / max) * 100, 2);
                return (
                  <div
                    key={day.date}
                    className="flex-1 group relative flex flex-col items-center justify-end"
                    title={`${day.date}: ${formatFCFA(day.revenue)} FCFA`}
                  >
                    <div
                      className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 bg-surface-container-highest text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-on-surface border border-outline-variant/30 z-10">
                      {day.date.slice(5)}: {formatFCFA(day.revenue)} F
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
            <span>{kpis.dailySales[0]?.date.slice(5)}</span>
            <span>{kpis.dailySales[kpis.dailySales.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
