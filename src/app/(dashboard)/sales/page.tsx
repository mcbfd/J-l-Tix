'use client';

import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA, formatDateFrench } from '@/lib/utils/format';
import Link from 'next/link';
import { CreditCard, ArrowRight, Smartphone, Banknote, ShoppingBag } from 'lucide-react';

export default function SalesPage() {
  const { orders, getDashboardKPIs } = useJeltixStore();
  const kpis = getDashboardKPIs();

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Gestion des Ventes</h1>
          <p className="text-sm text-on-surface-variant">
            Suivi des encaissements en temps réel, transactions Mobile Money et guichet.
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md"
        >
          <span className="material-symbols-outlined text-[20px] text-[#4EED15]">point_of_sale</span>
          <span>Ouvrir Guichet Caisse (POS)</span>
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Chiffre d'Affaires Total
          </p>
          <p className="text-3xl font-black text-primary font-mono">
            {formatFCFA(kpis.totalRevenue)} <span className="text-sm font-normal text-on-surface-variant">FCFA</span>
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Billets Émis & Payés
          </p>
          <p className="text-3xl font-black text-tertiary font-mono">
            {kpis.totalTicketsSold.toLocaleString('fr-FR')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Part Mobile Money (Wave / OM)
          </p>
          <p className="text-3xl font-black text-on-surface font-mono">
            86% <span className="text-xs text-tertiary font-bold">+8% ce mois</span>
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface">Dernières Commandes Jël Tix</h2>
          <span className="text-xs text-on-surface-variant font-mono">{orders.length} commandes enregistrées</span>
        </div>

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
                    Aucune commande passée dans cette session. Utilisez la billetterie publique ou le guichet pour passer une commande.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-4 font-mono font-black text-xs text-primary">{ord.reference}</td>
                    <td className="p-4">
                      <p className="font-extrabold text-on-surface">{ord.customerName}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono">{ord.customerPhone}</p>
                    </td>
                    <td className="p-4 text-on-surface font-semibold truncate max-w-xs">{ord.eventTitle}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-surface-container-high">
                        {ord.channel === 'POS_GUICHET' ? 'GUICHET POS' : 'EN LIGNE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-on-surface">
                        {ord.paymentMethod === 'WAVE' ? 'Wave' : ord.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : 'Espèces'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-on-surface font-mono">
                      {formatFCFA(ord.totalAmount)} FCFA
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold text-[10px] font-mono">
                        PAYÉ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
