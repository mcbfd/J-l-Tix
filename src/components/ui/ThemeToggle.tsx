'use client';

import React from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border select-none font-bold text-xs shadow-xs ${
        theme === 'dark'
          ? 'bg-[#0B1A3A] hover:bg-[#0F2248] text-[#4EED15] border-white/15 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-[#0038A8] border-slate-200/90 shadow-xs'
      } ${className}`}
      title={theme === 'dark' ? 'Passer en Mode Clair (Design Épuré)' : 'Passer en Mode Sombre (Nuit Prestige)'}
      aria-label="Changer de thème (Clair / Sombre)"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-[#4EED15] animate-pulse" />
          {showLabel && <span className="text-xs font-extrabold text-white">Mode Clair</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-[#0038A8]" />
          {showLabel && <span className="text-xs font-extrabold text-slate-800">Mode Sombre</span>}
        </>
      )}
    </button>
  );
}
