'use client';

import { useState } from 'react';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { useTheme } from '@/lib/theme/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { playSuccessBeep, playErrorBuzzer } from '@/lib/audio/sound-effects';
import { ScanResultType, Ticket } from '@/types';
import { formatRelativeTime } from '@/lib/utils/format';
import Link from 'next/link';
import {
  Camera,
  DoorOpen,
  CheckCircle2,
  XCircle,
  QrCode,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Flashlight,
  History,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const GATES = [
  'Porte A - Entrée Principale',
  'Porte B - Gradins Sud',
  'Porte C - VIP Prestige',
  'Porte D - Tribune Presse',
];

export default function PwaScannerPage() {
  const { validateScanAtomic, scans, tickets } = useJeltixStore();
  const { theme } = useTheme();

  const [selectedGate, setSelectedGate] = useState('Porte A - Entrée Principale');
  const [controllerName] = useState('Agent Contrôle #12');
  const [manualCode, setManualCode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: ScanResultType;
    message: string;
    ticket?: Ticket;
    previousScanDate?: string;
    previousScanGate?: string;
  } | null>(null);

  // Filter gate stats
  const gateScans = scans.filter((s) => s.gate === selectedGate);
  const gateValidCount = gateScans.filter((s) => s.result === 'VALID').length;
  const gateFraudCount = gateScans.filter((s) => s.result !== 'VALID').length;

  const handleScanCode = (code: string) => {
    if (!code.trim()) return;

    const result = validateScanAtomic(code, selectedGate, controllerName);

    if (result.success) {
      if (soundEnabled) playSuccessBeep();
      setScanResult({
        status: 'VALID',
        message: result.message,
        ticket: result.ticket,
      });
    } else if (result.result === 'ALREADY_SCANNED') {
      if (soundEnabled) playErrorBuzzer();
      setScanResult({
        status: 'ALREADY_SCANNED',
        message: result.message,
        ticket: result.ticket,
        previousScanDate: result.previousScanDate,
        previousScanGate: result.previousScanGate,
      });
    } else {
      if (soundEnabled) playErrorBuzzer();
      setScanResult({
        status: 'INVALID',
        message: result.message,
      });
    }

    setManualCode('');
  };

  const clearResult = () => {
    setScanResult(null);
  };

  // 4 Sample testing tickets for immediate simulation
  const sampleTickets = [
    {
      id: 'sim-1',
      ticketCode: 'JT-7777-DEMO',
      customerName: 'Ibrahima Diallo',
      ticketTypeName: 'Tribune Couverte',
      label: 'Billet Valide (Demo)',
    },
    {
      id: 'sim-2',
      ticketCode: 'JT-2026-VIP',
      customerName: 'Aïssatou Ndiaye',
      ticketTypeName: 'Loge VIP Prestige',
      label: 'Billet VIP Valide',
    },
    {
      id: 'sim-3',
      ticketCode: 'JT-8921-X',
      customerName: 'Moussa Diop',
      ticketTypeName: 'Gradins Virage',
      label: 'Billet Déjà Utilisé',
    },
    {
      id: 'sim-4',
      ticketCode: 'JT-0000-FAUX',
      customerName: 'Inconnu',
      ticketTypeName: 'Faux Code',
      label: 'Code Invalide / Faux',
    },
  ];

  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full min-h-[100dvh] flex flex-col justify-between select-none overflow-x-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#050D1E] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. Header: Edge-to-Edge with Brand & Action Controls */}
      <header
        className={`w-full px-4 sm:px-6 py-3 border-b flex items-center justify-between shrink-0 z-10 shadow-sm transition-colors ${
          isDark
            ? 'bg-[#0B1936] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-xs shrink-0 flex items-center justify-center border border-slate-200/50">
            <img src="/logo.png" alt="Jël Tix" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-mono uppercase font-black tracking-wider ${
                  isDark ? 'text-[#4EED15]' : 'text-[#0038A8]'
                }`}
              >
                SCANNER PWA CONTRÔLEUR
              </span>
            </div>
            <p
              className={`text-[11px] font-mono flex items-center gap-1 leading-none mt-0.5 ${
                isDark ? 'text-white/70' : 'text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#2CA808] dark:bg-[#4EED15] animate-pulse" />
              <span>{controllerName} • Synchronisé</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30 opacity-60'
            }`}
            title={soundEnabled ? 'Son activé' : 'Son coupé'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Torch Simulator */}
          <button
            onClick={() => setTorchActive(!torchActive)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              torchActive
                ? 'bg-[#4EED15] text-[#002D8C] border-[#4EED15] shadow-md'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
            }`}
            title="Torche LED"
          >
            <Flashlight className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-[#0038A8] text-white hover:bg-[#002D8C] transition-colors shadow-xs"
            title="Quitter vers le Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 2. Top Bar: Gate Selector & Live Gate KPIs */}
      <div className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Porte / Tourniquet Actif
            </label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full bg-white dark:bg-[#0B1936] text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-white/15 outline-none text-slate-800 dark:text-white cursor-pointer shadow-xs"
            >
              {GATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="mt-4 px-3 py-2 rounded-xl bg-white dark:bg-[#0B1936] text-xs font-bold border border-slate-200 dark:border-white/15 flex items-center gap-1.5 shadow-xs cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <History className="w-3.5 h-3.5 text-primary" />
            <span>Historique ({gateScans.length})</span>
          </button>
        </div>

        {/* Mini Live Gate Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-[#0B1936] p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <p className="text-[9px] uppercase font-mono text-slate-400">Total Scans</p>
            <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{gateScans.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0B1936] p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <p className="text-[9px] uppercase font-mono text-[#2CA808] dark:text-[#4EED15]">Entrées Valides</p>
            <p className="text-base font-black text-[#2CA808] dark:text-[#4EED15] mt-0.5">{gateValidCount}</p>
          </div>
          <div className="bg-white dark:bg-[#0B1936] p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <p className="text-[9px] uppercase font-mono text-[#DC2626]">Doublons / Rejets</p>
            <p className="text-base font-black text-[#DC2626] mt-0.5">{gateFraudCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Main Center: Camera Viewfinder / Laser Target Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full relative">
        <div
          className={`relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border-2 shadow-2xl flex flex-col items-center justify-center transition-all ${
            torchActive ? 'ring-8 ring-[#4EED15]/40' : ''
          } ${
            isDark
              ? 'bg-[#0B1936] border-[#0038A8]/60 shadow-[#0038A8]/20'
              : 'bg-slate-900 border-slate-700 shadow-slate-900/30'
          }`}
        >
          {/* Active Laser Scanning Beam */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4EED15] to-transparent shadow-[0_0_15px_#4EED15] animate-scan-laser z-10 pointer-events-none" />

          {/* Viewfinder 4 Corner Brackets */}
          <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-[#4EED15] rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-[#4EED15] rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-[#4EED15] rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-[#4EED15] rounded-br-lg" />

          {/* Center Target Icon */}
          <div className="flex flex-col items-center text-center text-white/80 space-y-2 p-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md animate-pulse">
              <Camera className="w-8 h-8 text-[#4EED15]" />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-white">
              Centrez le QR Code Jël Tix
            </p>
            <p className="text-[11px] text-white/60 font-mono">
              Détection optique &lt; 0.5s
            </p>
          </div>

          {/* Full Screen Instant Scan Result Overlay */}
          {scanResult && (
            <div
              className={`absolute inset-0 z-30 p-5 flex flex-col justify-between animate-in zoom-in-95 duration-150 text-white ${
                scanResult.status === 'VALID'
                  ? 'bg-gradient-to-b from-[#0038A8] to-[#0A2666]'
                  : 'bg-gradient-to-b from-[#DC2626] to-[#7F1D1D]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span className="text-[10px] font-mono uppercase font-black tracking-wider">
                  RÉSULTAT DE CONTRÔLE
                </span>
                <button
                  onClick={clearResult}
                  className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold cursor-pointer"
                >
                  Scanner suivant ➔
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 my-auto">
                {scanResult.status === 'VALID' ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[#4EED15] text-[#002D8C] flex items-center justify-center shadow-xl">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <p className="text-xl font-black text-[#4EED15] tracking-tight">ACCÈS AUTORISÉ</p>
                    <p className="text-xs font-bold text-white/90">Billet #{scanResult.ticket?.ticketCode}</p>
                    <div className="bg-white/10 p-3 rounded-2xl w-full text-left text-xs space-y-1 mt-2">
                      <p className="font-bold">{scanResult.ticket?.customerName}</p>
                      <p className="text-white/80">{scanResult.ticket?.ticketTypeName}</p>
                      <p className="text-[11px] text-[#4EED15] font-mono">{scanResult.ticket?.gateRecommendation}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white text-[#DC2626] flex items-center justify-center shadow-xl">
                      <XCircle className="w-10 h-10" />
                    </div>
                    <p className="text-xl font-black text-white tracking-tight">ACCÈS REFUSÉ</p>
                    <p className="text-xs font-bold text-white/90">{scanResult.message}</p>
                    {scanResult.previousScanDate && (
                      <p className="text-[10px] font-mono bg-black/30 px-3 py-1 rounded-full mt-2">
                        1er passage : {new Date(scanResult.previousScanDate).toLocaleTimeString()} ({scanResult.previousScanGate})
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={clearResult}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-slate-100 cursor-pointer"
              >
                Valider & Fermer
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 4. Bottom Controls: Manual Code Input & Instant Simulator Buttons */}
      <footer
        className={`w-full max-w-md mx-auto p-4 border-t shrink-0 flex flex-col gap-3 transition-colors ${
          isDark
            ? 'bg-[#0B1936] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Manual Keyboard Code Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleScanCode(manualCode);
            }}
            placeholder="Saisir code billet (ex: JT-7777-DEMO)"
            className="flex-1 px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-surface-container border border-outline-variant/30 outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => handleScanCode(manualCode)}
            className="px-4 py-2.5 rounded-xl bg-[#0038A8] text-white font-bold text-xs hover:bg-[#002D8C] cursor-pointer shadow-xs shrink-0"
          >
            Valider
          </button>
        </div>

        {/* Quick Simulation Buttons Grid (2x2) */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 text-center">
            Simulateur de Scan Rapide (Tests Terrain)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sampleTickets.map((st) => (
              <button
                key={st.id}
                onClick={() => handleScanCode(st.ticketCode)}
                className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-left transition-transform active:scale-95 cursor-pointer shadow-2xs"
              >
                <p className="text-[11px] font-extrabold text-primary truncate font-mono">
                  {st.ticketCode}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">{st.label}</p>
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Slide-over Scan History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1936] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Historique des Scans ({selectedGate})
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
              {gateScans.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Aucun scan enregistré à cette porte.</p>
              ) : (
                gateScans.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold font-mono">#{s.ticketCode}</p>
                      <p className="text-[10px] text-slate-500">{formatRelativeTime(s.scannedAt)}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                        s.result === 'VALID'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {s.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
