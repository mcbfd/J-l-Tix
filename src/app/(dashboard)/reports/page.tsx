'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  WithdrawalRequest,
  AuditLogEntry,
  canAccessReports,
  canProcessWithdrawals,
  canRequestWithdrawal,
  canViewAuditLogs,
  canExportData,
  getDefaultRouteForRole,
} from '@/types';
import { isSuperAdminEmail } from '@/lib/services/profiles.service';
import {
  fetchWithdrawalRequests,
  submitWithdrawalRequest,
  updateWithdrawalRequestStatus,
  fetchAuditLogs,
} from '@/lib/services/payouts-audit.service';
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
  Lock,
  ArrowLeft,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Search,
  AlertCircle,
  X,
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
  const isSuper =
    currentUser?.role === 'SUPER_ADMIN' ||
    (Boolean(currentUser?.email) && isSuperAdminEmail(currentUser!.email));
  const effectiveRole = isSuper ? 'SUPER_ADMIN' : currentUser?.role;

  const isAdmin = effectiveRole === 'SUPER_ADMIN';
  const isOrganizer = effectiveRole === 'ORGANIZER';

  const [kpis, setKpis] = useState<PlatformKPIs | OrganizerKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: 'WAVE' as 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER',
    phoneNumber: '',
    bankDetails: '',
    note: '',
  });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  // Audit Logs state (Super Admin)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');


  // Load withdrawals and audit logs
  const loadWithdrawalsAndAudit = useCallback(async () => {
    if (isOrganizer && currentUser?.id) {
      setLoadingWithdrawals(true);
      try {
        const data = await fetchWithdrawalRequests(currentUser.id);
        setWithdrawals(data);
      } finally {
        setLoadingWithdrawals(false);
      }
    } else if (isAdmin) {
      setLoadingWithdrawals(true);
      setLoadingAudit(true);
      try {
        const [wData, aData] = await Promise.all([
          fetchWithdrawalRequests(),
          fetchAuditLogs(50),
        ]);
        setWithdrawals(wData);
        setAuditLogs(aData);
      } finally {
        setLoadingWithdrawals(false);
        setLoadingAudit(false);
      }
    }
  }, [isAdmin, isOrganizer, currentUser?.id]);

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
    loadWithdrawalsAndAudit();
  }, [loadKPIs, loadWithdrawalsAndAudit]);

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

  const handleStatusChange = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID') => {
    try {
      await updateWithdrawalRequestStatus(id, status, currentUser?.email || 'admin@jeltix.sn');
      await loadWithdrawalsAndAudit();
    } catch (e) {
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(withdrawalForm.amount, 10);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Veuillez renseigner un montant valide supérieur à 0.');
      return;
    }

    const availableNet = (kpis as OrganizerKPIs)?.netToMe || 0;
    if (amt > availableNet) {
      alert(`Le montant demandé (${formatFCFA(amt)} FCFA) dépasse votre solde disponible net (${formatFCFA(availableNet)} FCFA).`);
      return;
    }

    if ((withdrawalForm.method === 'WAVE' || withdrawalForm.method === 'ORANGE_MONEY') && !withdrawalForm.phoneNumber.trim()) {
      alert('Veuillez renseigner le numéro de téléphone pour le transfert Mobile Money.');
      return;
    }

    if (withdrawalForm.method === 'BANK_TRANSFER' && !withdrawalForm.bankDetails.trim()) {
      alert('Veuillez renseigner les coordonnées bancaires (IBAN / RIB).');
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      await submitWithdrawalRequest({
        organizerId: currentUser?.id || 'org-me',
        organizerName: currentUser?.fullName || 'Organisateur',
        organizerEmail: currentUser?.email || 'organizer@jeltix.sn',
        amount: amt,
        method: withdrawalForm.method,
        phoneNumber: withdrawalForm.phoneNumber,
        bankDetails: withdrawalForm.bankDetails,
        note: withdrawalForm.note,
      });
      setShowWithdrawalModal(false);
      setWithdrawalForm({
        amount: '',
        method: 'WAVE',
        phoneNumber: '',
        bankDetails: '',
        note: '',
      });
      await loadWithdrawalsAndAudit();
      alert('Votre demande de retrait a été soumise avec succès.');
    } catch (err) {
      alert('Erreur lors de la soumission de la demande.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // ── Access Guard (RBAC) ──────────────────────────────────────────────────────────
  if (currentUser && !canAccessReports(effectiveRole)) {
    const defaultRoute = getDefaultRouteForRole(effectiveRole);
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-on-surface mb-2">Accès Restreint</h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          La consultation des rapports et de la comptabilité est réservée aux Organisateurs et Super Administrateurs.
        </p>
        <Link
          href={defaultRoute}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Aller à mon espace</span>
        </Link>
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Rapports &amp; Audit Financier
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Données en temps réel depuis Supabase ·{' '}
            <span className="font-mono">
              Actualisé {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canRequestWithdrawal(effectiveRole) && (
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Demander un Retrait</span>
            </button>
          )}
          <button
            onClick={loadKPIs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {canExportData(effectiveRole) && (
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
          )}
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
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/30">
        <ShieldCheck className="w-5 h-5 text-[#4EED15] shrink-0" />
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

      {/* ── Section Retraits pour Organisateur (Demander Retrait) ──────────────── */}
      {isOrganizer && canRequestWithdrawal(effectiveRole) && (
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Mes Demandes de Retraits
              </h3>
            </div>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Faire une nouvelle demande</span>
            </button>
          </div>

          {loadingWithdrawals ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-outline-variant/40 rounded-2xl">
              <p className="text-xs text-on-surface-variant font-mono">
                Aucune demande de retrait effectuée. Vous pouvez demander un virement dès que des fonds sont disponibles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                    <th className="pb-3 font-bold">RÉFÉRENCE</th>
                    <th className="pb-3 font-bold">MONTANT</th>
                    <th className="pb-3 font-bold">MÉTHODE</th>
                    <th className="pb-3 font-bold">COORDONNÉES</th>
                    <th className="pb-3 font-bold">DATE</th>
                    <th className="pb-3 font-bold text-right">STATUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-surface/50">
                      <td className="py-3 font-bold text-on-surface">{w.id}</td>
                      <td className="py-3 font-bold text-primary">{formatFCFA(w.amount)} FCFA</td>
                      <td className="py-3">{w.method}</td>
                      <td className="py-3 text-on-surface-variant">{w.phoneNumber || w.bankDetails || '—'}</td>
                      <td className="py-3 text-on-surface-variant">
                        {new Date(w.requestedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                            w.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : w.status === 'APPROVED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : w.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {w.status === 'PAID'
                            ? 'PAYÉ'
                            : w.status === 'APPROVED'
                            ? 'APPROUVÉ'
                            : w.status === 'REJECTED'
                            ? 'REJETÉ'
                            : 'EN ATTENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Section Traitement des Retraits pour Super Admin ─────────────────── */}
      {isAdmin && canProcessWithdrawals(effectiveRole) && (
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Traitement des Demandes de Retrait (Super Admin)
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface text-on-surface-variant border border-outline-variant/30">
              {withdrawals.filter((w) => w.status === 'PENDING').length} en attente
            </span>
          </div>

          {loadingWithdrawals ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-outline-variant/40 rounded-2xl">
              <p className="text-xs text-on-surface-variant font-mono">
                Aucune demande de retrait sur la plateforme.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                    <th className="pb-3 font-bold">ORGANISATEUR</th>
                    <th className="pb-3 font-bold">MONTANT</th>
                    <th className="pb-3 font-bold">MÉTHODE &amp; COMPTE</th>
                    <th className="pb-3 font-bold">DATE</th>
                    <th className="pb-3 font-bold">STATUT</th>
                    <th className="pb-3 font-bold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-surface/50">
                      <td className="py-3">
                        <p className="font-bold text-on-surface">{w.organizerName}</p>
                        <p className="text-[10px] text-on-surface-variant">{w.organizerEmail}</p>
                      </td>
                      <td className="py-3 font-bold text-primary">
                        {formatFCFA(w.amount)} FCFA
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-on-surface">{w.method}</p>
                        <p className="text-[10px] text-on-surface-variant">{w.phoneNumber || w.bankDetails || '—'}</p>
                      </td>
                      <td className="py-3 text-on-surface-variant">
                        {new Date(w.requestedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : w.status === 'APPROVED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : w.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {w.status === 'PAID'
                            ? 'PAYÉ'
                            : w.status === 'APPROVED'
                            ? 'APPROUVÉ'
                            : w.status === 'REJECTED'
                            ? 'REJETÉ'
                            : 'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {w.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusChange(w.id, 'PAID')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                              title="Valider et marquer comme payé"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Payer</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(w.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                              title="Rejeter la demande"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Rejeter</span>
                            </button>
                          </div>
                        )}
                        {w.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStatusChange(w.id, 'PAID')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                          >
                            Marquer Payé
                          </button>
                        )}
                        {(w.status === 'PAID' || w.status === 'REJECTED') && (
                          <span className="text-[10px] text-on-surface-variant font-mono">Traité</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Section Journaux d'Audit & Sécurité pour Super Admin ──────────────── */}
      {isAdmin && canViewAuditLogs(effectiveRole) && (
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Journaux d'Audit &amp; Sécurité (Super Admin)
              </h3>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filtrer les logs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {loadingAudit ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-outline-variant/40 rounded-2xl">
              <p className="text-xs text-on-surface-variant font-mono">
                Aucun log d'audit enregistré.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                    <th className="pb-3 font-bold">DATE / HEURE</th>
                    <th className="pb-3 font-bold">ACTION</th>
                    <th className="pb-3 font-bold">ACTEUR</th>
                    <th className="pb-3 font-bold">CIBLE &amp; DÉTAILS</th>
                    <th className="pb-3 font-bold text-right">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {auditLogs
                    .filter(
                      (l) =>
                        !auditSearch ||
                        l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        l.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (l.details && l.details.toLowerCase().includes(auditSearch.toLowerCase()))
                    )
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-surface/50">
                        <td className="py-3 text-on-surface-variant whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant/30 font-bold text-[10px] text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 text-on-surface font-semibold max-w-[200px] truncate">
                          {log.performedBy}
                        </td>
                        <td className="py-3 text-on-surface-variant max-w-[320px]">
                          <p className="font-semibold text-on-surface truncate">{log.target || '—'}</p>
                          <p className="text-[10px] text-on-surface-variant line-clamp-1">{log.details || '—'}</p>
                        </td>
                        <td className="py-3 text-right text-on-surface-variant font-mono text-[10px]">
                          {log.ipAddress || 'Interne'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Demande de Retrait (Organisateur) ──────────────────────────── */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface-container w-full max-w-md rounded-3xl p-6 border border-outline-variant/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-on-surface">Demander un Retrait</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono">Transfert sécurisé de vos recettes nettes</p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="p-1 rounded-xl text-on-surface-variant hover:bg-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Solde disponible banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Solde net disponible :</span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatFCFA(net)} FCFA
              </span>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              {/* Montant */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Montant à retirer (FCFA) *
                </label>
                <input
                  type="number"
                  min="1000"
                  max={net}
                  step="500"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  placeholder="Ex: 150000"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-sm font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2 mt-2">
                  {[0.25, 0.5, 1].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setWithdrawalForm({
                          ...withdrawalForm,
                          amount: Math.floor(net * pct).toString(),
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface border border-outline-variant/30 text-[10px] font-mono font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      {pct === 1 ? '100% (Tout)' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Méthode de réception *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawalForm({ ...withdrawalForm, method: m })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                        withdrawalForm.method === m
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-outline-variant/30 bg-surface text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      {m === 'WAVE' ? 'Wave' : m === 'ORANGE_MONEY' ? 'Orange Money' : 'Virement'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone ou RIB */}
              {withdrawalForm.method === 'BANK_TRANSFER' ? (
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Coordonnées bancaires (IBAN / RIB / Nom Banque) *
                  </label>
                  <textarea
                    rows={2}
                    value={withdrawalForm.bankDetails}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankDetails: e.target.value })}
                    placeholder="Ex: SN08 0100 1234 5678 9012 3456 78 - CBAO"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Numéro de téléphone ({withdrawalForm.method === 'WAVE' ? 'Wave' : 'Orange Money'}) *
                  </label>
                  <input
                    type="tel"
                    value={withdrawalForm.phoneNumber}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, phoneNumber: e.target.value })}
                    placeholder="Ex: +221 77 000 00 00"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Note facultative */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Remarque / Motif (optionnel)
                </label>
                <input
                  type="text"
                  value={withdrawalForm.note}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, note: e.target.value })}
                  placeholder="Ex: Retrait partiel billetterie"
                  className="w-full px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdrawal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingWithdrawal ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Confirmer la Demande</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

