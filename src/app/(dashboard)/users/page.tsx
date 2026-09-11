'use client';

import { useState } from 'react';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import { UserRole, UserProfile } from '@/types';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Building,
  User,
  Power,
  Sparkles,
} from 'lucide-react';

export default function UsersPage() {
  const { users, addUser, toggleUserStatus } = useJeltixStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CONTROLLER');
  const [organization, setOrganization] = useState('Sécurité Stade Abdoulaye Wade');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return <span className="px-2.5 py-1 rounded-full bg-primary text-white font-black text-[10px] font-mono">SUPER ADMIN</span>;
      case 'ORGANIZER':
        return <span className="px-2.5 py-1 rounded-full bg-[#2CA808] dark:bg-[#4EED15] text-white dark:text-[#002D8C] font-black text-[10px] font-mono">ORGANISATEUR</span>;
      case 'SELLER':
        return <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-black text-[10px] font-mono">VENDEUR GUICHET</span>;
      case 'CONTROLLER':
        return <span className="px-2.5 py-1 rounded-full bg-[#0038A8]/15 text-[#0038A8] dark:text-[#4EED15] font-black text-[10px] font-mono">CONTRÔLEUR PORTE</span>;
      case 'FINANCE':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] font-mono">FINANCE & AUDIT</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant font-bold text-[10px] font-mono">{r}</span>;
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    addUser({
      fullName,
      email,
      phone: phone || '+221 77 000 00 00',
      role,
      organization: organization || 'Jël Tix SAS',
      isActive: true,
    });

    showToast(`Utilisateur ${fullName} invité avec succès !`);
    setShowInviteModal(false);
    setFullName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 bg-[#0038A8] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#4EED15]" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Gestion des Utilisateurs & Rôles</h1>
          <p className="text-sm text-on-surface-variant">
            Super Administrateurs, Organisateurs certifiés, Vendeurs de guichet et Agents de contrôle Jël Tix.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un Utilisateur / Agent</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface">Comptes Opérateurs Jël Tix</h2>
          <span className="text-xs text-on-surface-variant font-mono">{users.length} comptes enregistrés</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant border-b border-surface-container-high uppercase tracking-wider font-mono">
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Email</th>
                <th className="p-4">Organisation</th>
                <th className="p-4">Rôle</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-surface-container-highest transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                        {usr.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-on-surface text-sm">{usr.fullName}</p>
                        <p className="text-[11px] text-on-surface-variant font-mono">{usr.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono text-on-surface-variant">{usr.email}</td>
                  <td className="p-4 text-xs font-medium text-on-surface">{usr.organization || 'Jël Tix SAS'}</td>
                  <td className="p-4">{getRoleBadge(usr.role)}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        usr.isActive
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${usr.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {usr.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        toggleUserStatus(usr.id);
                        showToast(`Statut de ${usr.fullName} modifié.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-[11px] border border-outline-variant/30 cursor-pointer transition-colors inline-flex items-center gap-1"
                    >
                      <Power className="w-3 h-3 text-primary" />
                      <span>{usr.isActive ? 'Désactiver' : 'Activer'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1936] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-black">Ajouter un Membre / Contrôleur</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Babacar Ndiaye"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                  Email Professionnel *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: babacar@jeltix.sn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                  Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                    Rôle Système
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none font-bold cursor-pointer"
                  >
                    <option value="CONTROLLER">Contrôleur Porte</option>
                    <option value="SELLER">Vendeur Guichet</option>
                    <option value="ORGANIZER">Organisateur</option>
                    <option value="FINANCE">Finance & Audit</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                    Organisation / Poste
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Stade Abdoulaye Wade"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#0038A8] hover:bg-[#002D8C] text-white font-bold cursor-pointer shadow-md"
                >
                  Confirmer l'Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 font-bold cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
