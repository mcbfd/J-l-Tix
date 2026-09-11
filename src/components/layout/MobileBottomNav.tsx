'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Ticket, QrCode, LayoutDashboard } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav inside full screen scanner
  if (pathname === '/scan') return null;

  const NAV_ITEMS = [
    {
      href: '/',
      label: 'Accueil',
      icon: Home,
      isActive: pathname === '/' || pathname === '/events',
    },
    {
      href: '/events/match-pilote-finale-coupe',
      label: 'Match',
      icon: Calendar,
      isActive: pathname.startsWith('/events/'),
    },
    {
      href: '/tickets/JT-7777-DEMO',
      label: 'Mon Billet',
      icon: Ticket,
      isActive: pathname.startsWith('/tickets/'),
    },
    {
      href: '/scan',
      label: 'Scanner',
      icon: QrCode,
      isActive: pathname === '/scan',
      isSpecial: true,
    },
    {
      href: '/dashboard',
      label: 'Espace Pro',
      icon: LayoutDashboard,
      isActive: pathname.startsWith('/dashboard') || pathname.startsWith('/sales') || pathname.startsWith('/scans') || pathname.startsWith('/reports') || pathname.startsWith('/users'),
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071229]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 select-none ${
                item.isActive
                  ? 'text-[#0038A8] dark:text-[#4EED15] font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.isSpecial ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0038A8] to-[#0D52D6] text-white flex items-center justify-center shadow-md -mt-2">
                  <Icon className="w-4 h-4 text-[#4EED15]" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              )}
              <span className="text-[10px] tracking-tight mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
