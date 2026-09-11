'use client';

import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatFCFA, formatDateFrench } from '@/lib/utils/format';
import { Download, BarChart3, TrendingUp, PieChart, ShieldCheck, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const { getDashboardKPIs, events, orders } = useJeltixStore();
  const kpis = getDashboardKPIs();

  const handleExportCSV = () => {
    const headers = 'Reference,Client,Telephone,Evenement,Canal,Montant,Mode_Paiement,Statut,Date\n';
    const rows = orders
      .map(
        (o) =>
          `"${o.reference}","${o.customerName}","${o.customerPhone}","${o.eventTitle}","${o.channel}",${o.totalAmount},"${o.paymentMethod}","${o.paymentStatus}","${o.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeltix_rapport_ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Rapports & Audit Financier</h1>
          <p className="text-sm text-on-surface-variant">
            Rapports de billetterie, ventilation des recettes Wave / OM / Espèces et exportation certifiée.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#4EED15]" />
          <span>Exporter Rapport CSV Jël Tix</span>
        </button>
      </div>

      {/* Financial Summary 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs">
          <p className="text-[11px] text-on-surface-variant mb-1 font-mono uppercase font-bold">Revenu Brut Global</p>
          <p className="text-2xl font-black text-on-surface">{formatFCFA(kpis.totalRevenue)} FCFA</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs">
          <p className="text-[11px] text-on-surface-variant mb-1 font-mono uppercase font-bold">Commission Jël Tix (3%)</p>
          <p className="text-2xl font-black text-primary">{formatFCFA(Math.round(kpis.totalRevenue * 0.03))} FCFA</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs">
          <p className="text-[11px] text-on-surface-variant mb-1 font-mono uppercase font-bold">Net à Reverser Organisateurs</p>
          <p className="text-2xl font-black text-tertiary">{formatFCFA(Math.round(kpis.totalRevenue * 0.97))} FCFA</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs">
          <p className="text-[11px] text-on-surface-variant mb-1 font-mono uppercase font-bold">Panier Moyen / Spectateur</p>
          <p className="text-2xl font-black text-on-surface">620 FCFA</p>
        </div>
      </div>

      {/* Breakdown by Channels & Payment Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider font-mono">Ventilation Paiements</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Wave Sénégal (0% frais client)</span>
                <span className="font-mono text-primary">62%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-[#1DC9FE] rounded-full" style={{ width: '62%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Orange Money</span>
                <span className="font-mono text-[#FF7900]">24%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-[#FF7900] rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Guichet Espèces (POS)</span>
                <span className="font-mono text-tertiary">14%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-[#2CA808] rounded-full" style={{ width: '14%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown by Event */}
        <div className="lg:col-span-2 bg-surface-container rounded-3xl p-6 border border-outline-variant/30 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider font-mono">
            Répartition des Recettes par Événement
          </h3>

          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 bg-surface rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-sm text-on-surface">{evt.title}</h4>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {evt.venue} • {evt.organizerName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-primary font-mono">
                    {formatFCFA(evt.soldCapacity * 420)} FCFA
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    {evt.soldCapacity.toLocaleString('fr-FR')} billets vendus
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
