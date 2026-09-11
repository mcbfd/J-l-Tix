'use client';

import { useState, memo, useMemo } from 'react';
import Link from 'next/link';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import type { Order } from '@/types';

interface DataPoint {
  day: string;
  sales: number;
  revenue: number;
  cx: number;
  cy: number;
}

/** Calcule les données des 7 derniers jours depuis les orders réels du store */
function buildChartData(orders: Order[]): DataPoint[] {
  const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();

  // Créer un tableau des 7 derniers jours (du plus ancien au plus récent)
  const days: { label: string; date: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ label: DAY_LABELS[d.getDay()], date: d });
  }

  // Agréger les ventes et revenus par jour
  const buckets = days.map(({ label, date }) => {
    const dayStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.createdAt.startsWith(dayStr));
    const sales = dayOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, it) => s + it.quantity, 0);
    }, 0);
    const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { label, sales, revenue };
  });

  // Calculer les positions Y (inversé : plus c'est haut, plus c'est bas dans SVG)
  const maxSales = Math.max(...buckets.map((b) => b.sales), 1);

  return buckets.map((b, i) => {
    const cx = Math.round((i / (buckets.length - 1)) * 800);
    const normalizedY = b.sales / maxSales; // 0..1
    const cy = Math.round(300 - normalizedY * 250); // SVG Y: 50 (top) … 300 (bottom)
    return {
      day: b.label,
      sales: b.sales,
      revenue: b.revenue,
      cx,
      cy,
    };
  });
}

/** Construit le path SVG d'une courbe lissée via des commandes cubiques */
function buildSmoothPath(points: { cx: number; cy: number }[]): string {
  if (points.length === 0) return '';
  let d = `M${points[0].cx},${points[0].cy}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.cx + curr.cx) / 2;
    d += ` C${cpX},${prev.cy} ${cpX},${curr.cy} ${curr.cx},${curr.cy}`;
  }
  return d;
}

export const SalesChart = memo(function SalesChart() {
  const { orders } = useJeltixStore();
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const dataPoints = useMemo(() => buildChartData(orders), [orders]);

  const linePath = useMemo(() => buildSmoothPath(dataPoints), [dataPoints]);
  const areaPath = useMemo(() => {
    if (dataPoints.length === 0) return '';
    const firstPt = dataPoints[0];
    const lastPt = dataPoints[dataPoints.length - 1];
    return `M${firstPt.cx},300 ${buildSmoothPath(dataPoints).slice(1)} L${lastPt.cx},300 Z`;
  }, [dataPoints]);

  const hasData = orders.length > 0;

  return (
    <div className="bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs flex flex-col h-full min-h-[420px] border border-slate-200/90 dark:border-white/10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Ventes des 7 derniers jours</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {hasData
              ? 'Évolution quotidienne des encaissements en ligne et guichet'
              : 'Aucune vente enregistrée — les données apparaîtront au premier achat'}
          </p>
        </div>
        <Link
          href="/sales"
          prefetch={true}
          className="text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
        >
          <span>Voir détail</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Hover Info Tooltip */}
      <div className="h-7 mb-2 flex items-center">
        {hoveredPoint ? (
          <div className="flex items-center gap-3 text-xs bg-surface-container px-3 py-1 rounded-full border border-primary/20 animate-in fade-in duration-150">
            <span className="font-bold text-primary">{hoveredPoint.day} :</span>
            <span className="font-medium text-on-surface">{hoveredPoint.sales} billet{hoveredPoint.sales !== 1 ? 's' : ''} vendu{hoveredPoint.sales !== 1 ? 's' : ''}</span>
            {hoveredPoint.revenue > 0 && (
              <span className="text-on-surface-variant">({hoveredPoint.revenue.toLocaleString('fr-FR')} FCFA)</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant italic">Survolez un point pour voir le détail journalier</p>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div className="flex-1 relative w-full h-full flex items-end pb-8">
        {!hasData ? (
          // État vide : afficher un placeholder
          <div className="absolute inset-0 flex items-center justify-center pb-8">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">bar_chart</span>
              <p className="text-xs text-on-surface-variant font-mono">Aucune donnée de vente</p>
              <p className="text-[11px] text-on-surface-variant/70">Commencez par créer une vente au guichet ou en ligne</p>
            </div>
          </div>
        ) : (
          <svg
            className="w-full h-full text-primary absolute bottom-8 left-0 overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 800 300"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Line Curve */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              className="transition-all duration-300"
            />

            {/* Interactive Circle Points */}
            {dataPoints.map((pt, idx) => (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={pt.cx}
                  cy={pt.cy}
                  r={hoveredPoint?.day === pt.day ? 9 : 6}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={hoveredPoint?.day === pt.day ? 4 : 3}
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </svg>
        )}

        {/* Days Axis */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs font-semibold text-on-surface-variant font-mono px-2">
          {dataPoints.map((pt) => (
            <span
              key={pt.day}
              className={`transition-colors ${
                hoveredPoint?.day === pt.day ? 'text-primary font-bold scale-110' : ''
              }`}
            >
              {pt.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});
