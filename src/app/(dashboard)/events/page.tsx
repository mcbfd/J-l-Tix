'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { formatDateFrench } from '@/lib/utils/format';
import { EventStatus } from '@/types';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Filter,
  TrendingUp,
} from 'lucide-react';

export default function EventsManagementPage() {
  const { events, updateEventStatus, deleteEvent, currentUser } = useJeltixStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Multi-tenant isolation: Organizers strictly see only their own events
  const scopedEvents = useMemo(() => {
    if (!currentUser || currentUser.role === 'SUPER_ADMIN') {
      return events;
    }
    return events.filter((evt) => evt.organizerId === currentUser.id);
  }, [events, currentUser]);

  const filteredEvents = useMemo(() => scopedEvents.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.locationDetails.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && evt.status === 'PUBLISHED') ||
      (statusFilter === 'draft' && evt.status === 'DRAFT') ||
      (statusFilter === 'closed' && evt.status === 'CLOSED');

    return matchesSearch && matchesStatus;
  }), [scopedEvents, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Réinitialiser la page au changement de filtre
  const handleSearchChange = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleStatusChange2 = (val: string) => { setStatusFilter(val); setCurrentPage(1); };

  const handleStatusChange = (eventId: string, nextStatus: EventStatus) => {
    updateEventStatus(eventId, nextStatus);
    showToast(`Statut de l'événement mis à jour : ${nextStatus}`);
  };

  const handleDelete = (eventId: string, title: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${title}" ?`)) {
      deleteEvent(eventId);
      showToast(`Événement supprimé avec succès.`);
    }
  };

  const totalSold = scopedEvents.reduce((s, e) => s + e.soldCapacity, 0);
  const totalCap = scopedEvents.reduce((s, e) => s + e.totalCapacity, 0);
  const avgFillRate = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;
  const totalRevenue = scopedEvents.reduce((s, e) => {
    const eventRev = (e.ticketTypes || []).reduce((catSum: number, cat) => catSum + (cat.soldQuantity || 0) * (cat.price || 0), 0);
    return s + eventRev;
  }, 0);
  const activeEventsCount = scopedEvents.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div className="flex flex-col w-full relative gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 bg-[#1D63ED] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#4EED15]" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header section with Title and Create Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestion des Événements
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 font-medium mt-1">
            Pilotez votre calendrier, surveillez les jauges et gérez vos billetteries actives.
          </p>
        </div>
        <Link
          href="/events/new"
          className="bg-[#1D63ED] hover:bg-[#154EC5] text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-[#1D63ED]/25 hover:scale-[0.98] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un événement</span>
        </Link>
      </div>

      {/* 4 Custom Summary Stat Cards matching the exact reference design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Événements Actifs */}
        <div className="bg-gradient-to-br from-[#EAF2FF] via-[#DBE8FE] to-[#D0E2FF] dark:from-[#0B1936] dark:to-[#0F2248] rounded-2xl p-5 shadow-xs border border-blue-200/60 dark:border-white/10 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#1D63ED] text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">event_available</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold font-mono text-blue-900 dark:text-white/60 uppercase tracking-wider">
              Événements Actifs
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {activeEventsCount}
            </p>
          </div>
        </div>

        {/* Card 2: Billets Vendus */}
        <div className="bg-gradient-to-br from-[#E6F7F0] via-[#D3F3E5] to-[#C2EEDD] dark:from-[#0B1936] dark:to-[#0F2248] rounded-2xl p-5 shadow-xs border border-emerald-200/60 dark:border-white/10 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold font-mono text-emerald-900 dark:text-white/60 uppercase tracking-wider">
              Billets Vendus (Mois)
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalSold.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Card 3: Chiffre d'Affaires */}
        <div className="bg-gradient-to-br from-[#EEF2FF] via-[#E0E7FF] to-[#D4DCFF] dark:from-[#0B1936] dark:to-[#0F2248] rounded-2xl p-5 shadow-xs border border-indigo-200/60 dark:border-white/10 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold font-mono text-indigo-900 dark:text-white/60 uppercase tracking-wider">
              Chiffre d'Affaires
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalRevenue > 0 ? (
                <>
                  {totalRevenue.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-600 dark:text-white/70">CFA</span>
                </>
              ) : (
                <>
                  0 <span className="text-xs font-bold text-slate-600 dark:text-white/70">CFA</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Taux de Remplissage Global */}
        <div className="bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#A5F3FC] dark:from-[#0B1936] dark:to-[#0F2248] rounded-2xl p-5 shadow-xs border border-sky-200/60 dark:border-white/10 flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-extrabold font-mono text-sky-900 dark:text-white/60 uppercase tracking-wider">
              Taux de Remplissage Global
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-3xl font-black text-slate-900 dark:text-[#4EED15]">{avgFillRate}%</p>
              <TrendingUp className="w-5 h-5 text-[#059669] dark:text-[#4EED15]" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Toolbar Container */}
      <div className="bg-white dark:bg-[#0B1936] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un événement, lieu..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-medium border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#1D63ED]"
            />
          </div>

          {/* Filter Pill Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex items-center bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-white/10">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange2(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white text-xs font-extrabold outline-none cursor-pointer pr-2"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
                <option value="closed">Clôturés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full rounded-2xl border border-slate-200/70 dark:border-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-white/5 text-[11px] font-extrabold text-slate-600 dark:text-white/70 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-mono">
                <th className="p-4">Événement</th>
                <th className="p-4">Lieu</th>
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Jauge / Ventes</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#0B1936]">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-white/60">
                    Aucun événement trouvé pour ces critères de recherche.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => {
                  const fillPercent = Math.round((evt.soldCapacity / evt.totalCapacity) * 100);

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-xs">
                            <Image
                              src={evt.bannerImage}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-sm">{evt.title}</p>
                            <span className="text-[10px] font-extrabold text-[#1D63ED] dark:text-[#4EED15] font-mono bg-blue-50 dark:bg-white/10 px-2 py-0.5 rounded-md">
                              {evt.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-white">{evt.venue}</p>
                        <p className="text-slate-500 dark:text-white/60 text-[11px] font-mono">{evt.locationDetails}</p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-800 dark:text-white font-bold">
                          <Calendar className="w-3.5 h-3.5 text-[#1D63ED] dark:text-[#4EED15]" />
                          <span>{formatDateFrench(evt.startDate)}</span>
                        </div>
                        <p className="text-slate-500 dark:text-white/60 font-mono text-[11px] mt-0.5">{evt.timeString}</p>
                      </td>

                      <td className="p-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-extrabold text-slate-900 dark:text-white">{evt.soldCapacity.toLocaleString('fr-FR')}</span>
                            <span className="text-slate-500 dark:text-white/60">/ {evt.totalCapacity.toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                fillPercent >= 100
                                  ? 'bg-slate-400'
                                  : fillPercent > 0
                                  ? 'bg-[#059669]'
                                  : 'bg-slate-200 dark:bg-white/20'
                              }`}
                              style={{ width: `${Math.min(100, fillPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <select
                          value={evt.status}
                          onChange={(e) => handleStatusChange(evt.id, e.target.value as EventStatus)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold font-mono border cursor-pointer outline-none ${
                            evt.status === 'PUBLISHED'
                              ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                              : evt.status === 'DRAFT'
                              ? 'bg-[#E2E8F0] text-[#334155] border-[#CBD5E1]'
                              : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                          }`}
                        >
                          <option value="PUBLISHED">● PUBLIÉ</option>
                          <option value="DRAFT">● BROUILLON</option>
                          <option value="CLOSED">🔒 CLÔTURÉ</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/events/${evt.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors"
                            title="Voir la page publique"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(evt.id, evt.title)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 transition-colors cursor-pointer"
                            title="Supprimer l'événement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barre de pagination réelle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500 dark:text-white/60 font-medium">
          <p>
            Affichage de {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredEvents.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} sur {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    page === currentPage
                      ? 'bg-[#1D63ED] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
