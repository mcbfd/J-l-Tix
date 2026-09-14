'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

/**
 * DashboardShell — Client Component minimal
 * Seule la gestion de l'état mobileSidebarOpen est côté client.
 * Le reste du layout (Sidebar, Header) est rendu côté serveur si possible.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050D1E] text-slate-900 dark:text-white flex flex-col">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Backoffice Area — pas de transition-all pour éviter le reflow */}
      <div className="pl-0 lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="pt-32 lg:pt-36 flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}
