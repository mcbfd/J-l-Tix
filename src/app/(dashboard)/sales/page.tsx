'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA } from '@/lib/utils/format';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, RefreshCw, CreditCard, Smartphone, Banknote, ShoppingBag, Lock } from 'lucide-react';

interface SupabaseOrder {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  event_id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  channel: string;
  created_at: string;
  events: { title: string } | { title: string }[] | null;
}

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  WAVE: { label: 'Wave', color: '#1DC9FE' },
  ORANGE_MONEY: { label: 'Orange Money', color: '#FF7900' },
  FREE_MONEY: { label: 'Free Money', color: '#FF2D55' },
  CASH: { label: 'Espèces', color: '#4EED15' },
};

export default function SalesPage() {
  const { currentUser } = useJeltixStore();
  const isAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isOrganizer = currentUser?.role === 'ORGANIZER';
  const isSeller = currentUser?.role === 'SELLER';
  const isController = currentUser?.role === 'CONTROLLER';

  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mobileMoneyPct, setMobileMoneyPct] = useState(0);

  const loadOrders = useCallback(async () => {
    if (isController) return;
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('orders')
        .select('id, reference, customer_name, customer_phone, event_id, total_amount, payment_method, payment_status, channel, created_at, events (title)')
        .eq('payment_status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(100);

      if (isSeller) {
        // Le vendeur guichet voit uniquement ses ventes au comptoir POS
        query = query.eq('channel', 'POS') as typeof query;
      } else if (isOrganizer && currentUser?.id) {
        // L'organisateur voit uniquement les ventes de ses événements
        const { data: orgEvents } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', currentUser.id);
        const ids = (orgEvents ?? []).map((e: { id: string }) => e.id);
        if (ids.length > 0) {
          query = query.in('event_id', ids) as typeof query;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as unknown as SupabaseOrder[];
      setOrders(rows);

      const rev = rows.reduce((s, o) => s + (o.total_amount || 0), 0);
      setTotalRevenue(rev);

      // Mobile Money = Wave + Orange Money + Free Money
      const mmRev = rows
        .filter((o) => ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'].includes(o.payment_method))
        .reduce((s, o) => s + (o.total_amount || 0), 0);
      setMobileMoneyPct(rev > 0 ? Math.round((mmRev / rev) * 100) : 0);
    } catch (err) {
      console.error('Sales load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isOrganizer, isSeller, isController, currentUser?.id]);

  useEffect(() => {
    if (isAdmin || isOrganizer || isSeller) loadOrders();
    else setLoading(false);
  }, [loadOrders, isAdmin, isOrganizer, isSeller]);

  if (isController) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-on-surface mb-1">Accès Restreint</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mb-4 leading-relaxed">
          Le registre des ventes est réservé aux Vendeurs Guichet, Organisateurs et Super Administrateurs.
        </p>
        <Link
          href="/scan"
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-2"
        >
          <span>Accéder au Scanner Contrôleur</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">Gestion des Ventes</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Suivi des encaissements en temps réel depuis Supabase — Mobile Money et guichet.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualiser
          </button>
          <Link
            href="/sales/pos"
            className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4EED15]">point_of_sale</span>
            <span>Guichet POS</span>
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col gap-1">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Chiffre d'Affaires Total
          </p>
          <p className="text-2xl sm:text-3xl font-black text-primary font-mono">
            {loading ? '—' : `${formatFCFA(totalRevenue)}`}{' '}
            <span className="text-sm font-normal text-on-surface-variant">FCFA</span>
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col gap-1">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Commandes Complétées
          </p>
          <p className="text-2xl sm:text-3xl font-black text-tertiary font-mono">
            {loading ? '—' : orders.length.toLocaleString('fr-FR')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col gap-1">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Part Mobile Money
          </p>
          <p className="text-2xl sm:text-3xl font-black text-on-surface font-mono">
            {loading ? '—' : `${mobileMoneyPct}%`}
            <span className="text-xs text-tertiary font-bold ml-2">(Wave / OM / Free)</span>
          </p>
        </div>
      </div>

      {/* Orders — Vue Mobile (cards) */}
      <div className="md:hidden flex flex-col gap-3">
        <h2 className="text-sm font-bold text-on-surface px-1">Dernières Commandes</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-on-surface-variant font-mono">Chargement…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant text-xs">
            Aucune commande. Utilisez la billetterie publique ou le guichet POS.
          </div>
        ) : (
          orders.map((ord) => {
            const methodMeta = METHOD_LABELS[ord.payment_method] ?? { label: ord.payment_method, color: '#888' };
            return (
              <div key={ord.id} className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-black text-xs text-primary truncate">{ord.reference}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold text-[10px] font-mono shrink-0">PAYÉ</span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-on-surface">{ord.customer_name}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono">{ord.customer_phone}</p>
                </div>
                <p className="text-[11px] text-on-surface truncate">
                  {(Array.isArray(ord.events) ? ord.events[0]?.title : ord.events?.title) ?? '—'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container-high">
                      {ord.channel === 'POS_GUICHET' ? 'GUICHET' : 'EN LIGNE'}
                    </span>
                    <span className="text-xs font-bold" style={{ color: methodMeta.color }}>{methodMeta.label}</span>
                  </div>
                  <span className="font-black text-xs text-on-surface font-mono">{formatFCFA(ord.total_amount)} F</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Orders — Vue Desktop (table) */}
      <div className="hidden md:block bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface">Dernières Commandes Jël Tix</h2>
          <span className="text-xs text-on-surface-variant font-mono">
            {loading ? 'Chargement…' : `${orders.length} commandes`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-on-surface-variant font-mono">Chargement Supabase…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant border-b border-surface-container-high uppercase tracking-wider font-mono">
                  <th className="p-4">Référence</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Événement</th>
                  <th className="p-4">Canal</th>
                  <th className="p-4">Mode Paiement</th>
                  <th className="p-4 text-right">Montant</th>
                  <th className="p-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant text-xs">
                      Aucune commande complétée dans la base de données.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const methodMeta = METHOD_LABELS[ord.payment_method] ?? { label: ord.payment_method, color: '#888' };
                    return (
                      <tr key={ord.id} className="hover:bg-surface-container-highest transition-colors">
                        <td className="p-4 font-mono font-black text-xs text-primary">{ord.reference}</td>
                        <td className="p-4">
                          <p className="font-extrabold text-on-surface">{ord.customer_name}</p>
                          <p className="text-[11px] text-on-surface-variant font-mono">{ord.customer_phone}</p>
                        </td>
                        <td className="p-4 text-on-surface font-semibold truncate max-w-xs">
                          {(Array.isArray(ord.events) ? ord.events[0]?.title : ord.events?.title) ?? '—'}
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-surface-container-high">
                            {ord.channel === 'POS_GUICHET' ? 'GUICHET POS' : 'EN LIGNE'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold" style={{ color: methodMeta.color }}>
                            {methodMeta.label}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-on-surface font-mono">
                          {formatFCFA(ord.total_amount)} FCFA
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold text-[10px] font-mono">
                            PAYÉ
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
