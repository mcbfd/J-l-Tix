'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

/**
 * DashboardShell — Client Component minimal
 * Seule la gestion de l'état mobileSidebarOpen est côté client.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050D1E] text-slate-900 dark:text-white flex flex-col">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Backoffice Area */}
      <div className="pl-0 lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        {/* pt-20 = hauteur du header fixe (h-20). pb-20 sur mobile pour la bottom nav */}
        <main className="pt-20 pb-20 lg:pb-8 flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          <div className="pt-6">
            {children}
          </div>
        </main>
        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}
