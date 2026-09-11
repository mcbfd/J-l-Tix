'use client';

import { useState, useEffect } from 'react';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatRelativeTime } from '@/lib/utils/format';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export function LiveScansFeed() {
  const { scans } = useJeltixStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recentScans = scans.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs flex flex-col h-[420px] border border-slate-200/90 dark:border-white/10" suppressHydrationWarning>
      {/* Header with live ping */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/30">
        <h2 className="text-base font-black text-on-surface flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary" />
          </span>
          <span>Scans aux Portes en Direct</span>
        </h2>
        <span className="text-[10px] font-mono text-tertiary bg-tertiary-container/15 px-2.5 py-0.5 rounded-full font-bold">
          LIVE
        </span>
      </div>

      {/* Scans list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5" suppressHydrationWarning>
        {!mounted ? (
          <div className="text-center py-12 text-on-surface-variant text-xs font-mono animate-pulse">
            Chargement du flux en direct...
          </div>
        ) : recentScans.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant text-xs">
            Aucun scan récent pour le moment.
          </div>
        ) : (
          recentScans.map((scan) => {
            const isValid = scan.result === 'VALID';
            const isAlreadyScanned = scan.result === 'ALREADY_SCANNED';

            return (
              <div
                key={scan.id}
                suppressHydrationWarning
                className="bg-surface rounded-2xl p-3 flex items-start gap-3 group hover:bg-surface-container-highest transition-colors border border-outline-variant/10 shadow-2xs"
              >
                {/* Status icon circle */}
                <div
                  suppressHydrationWarning
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isValid
                      ? 'bg-tertiary-container/15 text-tertiary'
                      : 'bg-error-container/40 text-error'
                  }`}
                >
                  {isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <p className="text-xs font-black font-mono text-on-surface truncate" suppressHydrationWarning>
                    Billet #{scan.ticketCode}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate" suppressHydrationWarning>
                    {scan.gate}
                  </p>
                  <span className="text-[10px] text-on-surface-variant font-mono" suppressHydrationWarning>
                    {formatRelativeTime(scan.scannedAt)}
                  </span>
                </div>

                {/* Status Tag */}
                <span
                  suppressHydrationWarning
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                    isValid
                      ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}
                >
                  {isValid ? 'VALIDE' : isAlreadyScanned ? 'DÉJÀ SCANNÉ' : 'INVALIDE'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <div className="mt-3 pt-3 border-t border-outline-variant/30 text-center">
        <Link
          href="/scans"
          prefetch={true}
          className="text-on-surface-variant hover:text-primary text-xs font-bold transition-colors inline-flex items-center gap-1 active:scale-95"
        >
          <span>Voir tout l'historique de scan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
