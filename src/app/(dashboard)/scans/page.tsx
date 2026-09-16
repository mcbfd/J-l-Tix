'use client';

import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatRelativeTime } from '@/lib/utils/format';
import Link from 'next/link';
import { QrCode, ShieldCheck, CheckCircle2, XCircle, ExternalLink, Lock } from 'lucide-react';

export default function ScansPage() {
  const { scans, currentUser } = useJeltixStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isController = currentUser?.role === 'CONTROLLER';
  const isAuthorized = isSuperAdmin || isController;

  if (currentUser && !isAuthorized) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-on-surface mb-1">Accès Restreint aux Scans</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mb-4 leading-relaxed">
          Le journal des flux d'entrées et contrôles d'accès est réservé aux Agents de Contrôle et Super Administrateurs.
        </p>
        <Link
          href={currentUser.role === 'SELLER' ? '/sales/pos' : '/dashboard'}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-2"
        >
          <span>Retourner à mon espace</span>
        </Link>
      </div>
    );
  }

  const totalScans = scans.length;
  const validScans = scans.filter((s) => s.result === 'VALID').length;
  const fraudScans = scans.filter((s) => s.result === 'ALREADY_SCANNED' || s.result === 'INVALID').length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Journal des Scans & Contrôle d'Accès</h1>
          <p className="text-sm text-on-surface-variant">
            Contrôle des flux d'entrées aux portes, détection des tentatives de fraude et double passage.
          </p>
        </div>
        <Link
          href="/scan"
          target="_blank"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md"
        >
          <QrCode className="w-4 h-4 text-[#4EED15]" />
          <span>Ouvrir Scanner Contrôleur PWA</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Total Passages Contrôlés
          </p>
          <p className="text-3xl font-black text-on-surface font-mono">{totalScans}</p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Entrées Validées
          </p>
          <p className="text-3xl font-black text-tertiary font-mono">{validScans}</p>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30">
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1 font-bold">
            Alertes Doublons / Fraudes Déjouées
          </p>
          <p className="text-3xl font-black text-error font-mono">{fraudScans}</p>
        </div>
      </div>

      {/* Scans Full Table */}
      <div className="bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface">Historique d'audit des scans en direct</h2>
          <span className="text-xs font-mono text-tertiary bg-tertiary-container/15 px-3 py-1 rounded-full font-bold">
            Synchronisation Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant border-b border-surface-container-high uppercase tracking-wider font-mono">
                <th className="p-4">Billet</th>
                <th className="p-4">Type</th>
                <th className="p-4">Porte / Tourniquet</th>
                <th className="p-4">Contrôleur</th>
                <th className="p-4">Horodatage</th>
                <th className="p-4 text-center">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {scans.map((scan) => {
                const isValid = scan.result === 'VALID';
                const isAlreadyScanned = scan.result === 'ALREADY_SCANNED';

                return (
                  <tr key={scan.id} className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-4 font-mono font-black text-xs text-primary">
                      #{scan.ticketCode}
                    </td>
                    <td className="p-4 font-bold text-on-surface">{scan.ticketTypeName}</td>
                    <td className="p-4 text-on-surface">{scan.gate}</td>
                    <td className="p-4 text-on-surface-variant font-mono">{scan.controllerName}</td>
                    <td className="p-4 text-on-surface-variant font-mono">
                      {formatRelativeTime(scan.scannedAt)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full font-black text-[10px] font-mono ${
                          isValid
                            ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                            : isAlreadyScanned
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {isValid ? 'VALIDE' : isAlreadyScanned ? 'DÉJÀ SCANNÉ' : 'INVALIDE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
