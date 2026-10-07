'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItemData {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  addToast: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ── Individual Toast Item ─────────────────────────────────────────────────────

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastItemData;
  onRemove: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration ?? 3500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, toast.duration]);

  const configs: Record<ToastType, { icon: React.ReactNode; classes: string; bar: string }> = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-[#4EED15] shrink-0" />,
      classes: 'bg-[#0038A8] text-white border-white/15',
      bar: 'bg-[#4EED15]',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-300 shrink-0" />,
      classes: 'bg-red-600 text-white border-red-400/20',
      bar: 'bg-red-300',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />,
      classes: 'bg-amber-600 text-white border-amber-400/20',
      bar: 'bg-amber-300',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-200 shrink-0" />,
      classes: 'bg-slate-900 text-white border-white/10',
      bar: 'bg-blue-400',
    },
  };

  const { icon, classes, bar } = configs[toast.type];
  const duration = toast.duration ?? 3500;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 backdrop-blur-md ${classes} ${
        exiting ? 'animate-slide-out-right opacity-0' : 'animate-slide-in-right'
      }`}
      style={{ minWidth: 280, maxWidth: 400 }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${bar} origin-left`}
        style={{
          animation: `expand-width ${duration}ms linear reverse`,
        }}
      />

      <div className="pt-0.5">{icon}</div>

      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <p className="text-xs font-black uppercase tracking-wider font-mono opacity-90 mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-xs font-semibold leading-relaxed break-words">{toast.message}</p>
      </div>

      <button
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { title, message, type = 'success', duration } = options;
    setToasts((prev) => {
      // Limiter à 4 toasts simultanés
      const next = prev.length >= 4 ? prev.slice(1) : prev;
      return [...next, { id, title, message, type, duration }];
    });
  }, []);

  const addSimple = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    addToast({ message, type, duration });
  }, [addToast]);

  const value: ToastContextValue = {
    toast: addSimple,
    addToast,
    success: (msg, dur) => addToast({ message: msg, type: 'success', duration: dur }),
    error: (msg, dur) => addToast({ message: msg, type: 'error', duration: dur }),
    info: (msg, dur) => addToast({ message: msg, type: 'info', duration: dur }),
    warning: (msg, dur) => addToast({ message: msg, type: 'warning', duration: dur }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Portal — fixed top-right */}
      <div
        aria-label="Notifications"
        className="fixed top-24 right-4 z-[100] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
