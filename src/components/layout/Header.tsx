'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useStore } from '@/lib/store/jeltix-store';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { currentUser } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fermeture au click extérieur
  useEffect(() => {
    if (!showNotifications) return;

    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-white/95 dark:bg-[#071229]/95 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,45,140,0.04)] border-b border-slate-200 dark:border-white/10 z-30 flex items-center justify-between px-4 sm:px-8 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 transition-colors cursor-pointer"
          aria-label="Ouvrir le menu latéral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-[#1D63ED]/10 dark:bg-[#4EED15]/15 text-[#1D63ED] dark:text-[#4EED15] hidden sm:flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">
            verified_user
          </span>
        </div>
        <div>
          <span className="text-xs font-extrabold text-[#334155] dark:text-white/90 tracking-wider uppercase font-mono">
            PANNEAU D'ADMINISTRATION
          </span>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">Serveur Régional Dakar • En Ligne</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Light / Dark Mode Toggle Button */}
        <ThemeToggle />

        {/* Public portal link button */}
        <Link
          href="/"
          target="_blank"
          prefetch={true}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#0038A8] dark:text-white text-xs font-bold transition-colors border border-slate-200 dark:border-white/10 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-[#2CA808] dark:text-[#4EED15]">open_in_new</span>
          <span>Portail Public</span>
        </Link>

        {/* Notification Bell with interactive dropdown — closes on outside click */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors relative cursor-pointer"
            title="Notifications"
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#0B1936] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <p className="text-xs font-extrabold uppercase">Notifications Jël Tix</p>
              </div>
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-white/20">notifications_off</span>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Aucune notification pour le moment</p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <Link
          href="/login"
          className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-white/10 hover:opacity-80 transition-opacity"
          title="Changer de rôle / Se connecter"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {currentUser?.fullName || 'Admin Principal'}
            </p>
            <p className="text-[11px] text-[#0038A8] dark:text-[#4EED15] font-bold mt-1">
              {currentUser?.role === 'SUPER_ADMIN'
                ? 'Super Administrateur'
                : currentUser?.role === 'ORGANIZER'
                ? 'Organisateur'
                : currentUser?.role === 'SELLER'
                ? 'Vendeur POS'
                : currentUser?.role === 'CONTROLLER'
                ? 'Contrôleur Porte'
                : 'Utilisateur'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0038A8] to-[#0D52D6] text-white flex items-center justify-center shadow-md font-bold text-sm">
            <span>{currentUser?.fullName?.substring(0, 2).toUpperCase() || 'FT'}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
