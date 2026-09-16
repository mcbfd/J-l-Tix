'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { useStore } from '@/lib/store/jeltix-store';
import { createClient } from '@/lib/supabase/client';
import { getRoleLabel } from '@/components/layout/Header';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  QrCode,
  BarChart3,
  Users,
  ExternalLink,
  Store,
  X,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    materialIcon: 'dashboard',
    roles: ['SUPER_ADMIN', 'ORGANIZER', 'EVENT_MANAGER', 'FINANCE'],
  },
  {
    href: '/events',
    label: 'Événements',
    materialIcon: 'event',
    roles: ['SUPER_ADMIN', 'ORGANIZER', 'EVENT_MANAGER'],
  },
  {
    href: '/sales',
    label: 'Ventes & Recettes',
    materialIcon: 'payments',
    roles: ['SUPER_ADMIN', 'ORGANIZER', 'EVENT_MANAGER', 'SELLER', 'FINANCE'],
  },
  {
    href: '/scans',
    label: 'Contrôle & Scans',
    materialIcon: 'qr_code_scanner',
    roles: ['SUPER_ADMIN', 'ORGANIZER', 'CONTROLLER'],
  },
  {
    href: '/reports',
    label: 'Rapports & Audit',
    materialIcon: 'bar_chart',
    roles: ['SUPER_ADMIN', 'ORGANIZER', 'FINANCE'],
  },
  {
    href: '/users',
    label: 'Équipe & Rôles',
    materialIcon: 'group',
    roles: ['SUPER_ADMIN', 'ORGANIZER'],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const userRole = currentUser?.role || 'SUPER_ADMIN';

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setCurrentUser(null as any);
    if (typeof document !== 'undefined') {
      document.cookie = 'jeltix_auth_session=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('jeltix_current_user');
      localStorage.removeItem('jeltix_current_user_v2');
    }
    router.push('/login?logout=true');
    router.refresh();
  };

  const accessibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#060D1E] text-slate-800 dark:text-white z-50 flex flex-col border-r border-slate-200 dark:border-white/10 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 bg-white dark:bg-[#040915] border-b border-slate-200 dark:border-white/10">
          <Logo size="sm" href="/dashboard" />

          {/* Close button for Mobile */}
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {accessibleNavItems.length > 0 && (
            <>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 font-mono">
                Gestion & Administration
              </div>
              {accessibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={onCloseMobile}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm font-semibold ${
                      isActive
                        ? 'bg-[#0038A8] text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-3 text-[22px]">
                      {item.materialIcon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 font-mono">
            Opérations Terrain
          </div>

          {(userRole === 'SUPER_ADMIN' || userRole === 'ORGANIZER' || userRole === 'SELLER') && (
            <Link
              href="/sales/pos"
              prefetch={true}
              onClick={onCloseMobile}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm font-semibold ${
                pathname === '/sales/pos'
                  ? 'bg-[#0038A8] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined mr-3 text-[22px] text-[#2CA808] dark:text-[#4EED15]">
                point_of_sale
              </span>
              <span>Guichet POS (Caisse)</span>
            </Link>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'ORGANIZER' || userRole === 'CONTROLLER') && (
            <Link
              href="/scan"
              prefetch={true}
              target="_blank"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white group"
            >
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-3 text-[22px] text-[#2CA808] dark:text-[#4EED15]">
                  qr_code_scanner
                </span>
                <span>Scanner Contrôleur</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
            </Link>
          )}

          <Link
            href="/"
            prefetch={true}
            target="_blank"
            onClick={onCloseMobile}
            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white group"
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-3 text-[22px] text-[#0038A8] dark:text-[#4EED15]">
                storefront
              </span>
              <span>Portail Spectateurs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          </Link>
        </nav>

        {/* User Session & Logout Footer */}
        <div className="p-3 m-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#2CA808] dark:bg-[#4EED15] animate-pulse shrink-0" />
              <span className="text-[11px] font-black text-[#0038A8] dark:text-white truncate" suppressHydrationWarning>
                {currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Utilisateur')}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#0038A8]/10 dark:bg-[#4EED15]/20 text-[#0038A8] dark:text-[#4EED15] shrink-0" suppressHydrationWarning>
              {getRoleLabel(currentUser?.role, currentUser?.email)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-200/50 dark:border-red-800/30 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}
