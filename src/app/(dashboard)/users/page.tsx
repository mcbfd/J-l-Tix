'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store/jeltix-store';
import { UserRole, UserProfile } from '@/types';
import { syncUserProfile } from '@/lib/services/profiles.service';
import { InviteUserSchema } from '@/lib/validations';
import {
  createTeamMember,
  getTeamMembers,
  toggleTeamMemberStatus,
  removeFromTeam,
} from '@/lib/services/team-management.service';
import Link from 'next/link';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  X,
  Power,
  Lock,
  ArrowLeft,
  Users,
  RefreshCw,
  Trash2,
  QrCode,
  ShoppingCart,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Shared badge helper
// ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case 'SUPER_ADMIN':
      return <span className="px-2.5 py-1 rounded-full bg-primary text-white font-black text-[10px] font-mono">SUPER ADMIN</span>;
    case 'ORGANIZER':
      return <span className="px-2.5 py-1 rounded-full bg-[#2CA808] dark:bg-[#4EED15] text-white dark:text-[#002D8C] font-black text-[10px] font-mono">ORGANISATEUR</span>;
    case 'SELLER':
      return <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-black text-[10px] font-mono">VENDEUR GUICHET</span>;
    case 'CONTROLLER':
      return <span className="px-2.5 py-1 rounded-full bg-[#0038A8]/15 text-[#0038A8] dark:text-[#4EED15] font-black text-[10px] font-mono">CONTRÔLEUR PORTE</span>;
    case 'FINANCE':
      return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] font-mono">FINANCE &amp; AUDIT</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant font-bold text-[10px] font-mono">{role}</span>;
  }
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${active ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-400'}`} />
      {active ? 'Actif' : 'Désactivé'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast component
// ─────────────────────────────────────────────────────────────
function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed top-24 right-8 z-50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-right-4 duration-300 ${type === 'success' ? 'bg-[#0038A8] text-white border-white/20' : 'bg-red-600 text-white border-red-400/30'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#4EED15]" /> : <AlertTriangle className="w-4 h-4 text-red-200" />}
      <span className="text-xs font-bold">{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORGANIZER — Team Management View
// ─────────────────────────────────────────────────────────────
function OrganizerTeamView({ organizerId, organizerName }: { organizerId: string; organizerName: string }) {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'SELLER' | 'CONTROLLER'>('CONTROLLER');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const data = await getTeamMembers(organizerId);
    setMembers(data);
    setLoading(false);
  }, [organizerId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await createTeamMember({
      organizerId,
      email,
      fullName,
      role,
      phone: phone || undefined,
    });

    if (result.success && result.profile) {
      setMembers((prev) => [result.profile!, ...prev]);
      showToast(`${fullName} ajouté·e à votre équipe !`);
      setShowModal(false);
      setFullName(''); setEmail(''); setPhone('');
    } else {
      showToast(result.error || 'Erreur lors de la création.', 'error');
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (member: UserProfile) => {
    const result = await toggleTeamMemberStatus(organizerId, member.id);
    if (result.success) {
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, isActive: !m.isActive } : m));
      showToast(`Statut de ${member.fullName} modifié.`);
    } else {
      showToast(result.error || 'Erreur.', 'error');
    }
  };

  const handleRemove = async (member: UserProfile) => {
    if (!confirm(`Retirer ${member.fullName} de l'équipe ? Son compte Jël Tix sera conservé mais désassocié.`)) return;
    const result = await removeFromTeam(organizerId, member.id);
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showToast(`${member.fullName} retiré·e de l'équipe.`);
    } else {
      showToast(result.error || 'Erreur.', 'error');
    }
  };

  const sellers = members.filter((m) => m.role === 'SELLER');
  const controllers = members.filter((m) => m.role === 'CONTROLLER');

  return (
    <div className="flex flex-col w-full gap-6">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Mon Équipe</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Vendeurs guichet et contrôleurs de porte rattachés à <span className="font-bold text-primary">{organizerName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMembers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary-hover hover:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un Membre</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Équipe', value: members.length, icon: <Users className="w-4 h-4" />, color: 'text-primary bg-primary/10' },
          { label: 'Vendeurs Guichet', value: sellers.length, icon: <ShoppingCart className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Contrôleurs Porte', value: controllers.length, icon: <QrCode className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-on-surface font-mono">{stat.value}</p>
              <p className="text-[11px] text-on-surface-variant">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Membres de l'équipe
          </h2>
          <span className="text-xs text-on-surface-variant font-mono">{members.length} membre{members.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Chargement de l'équipe…</span>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary/50" />
            </div>
            <p className="font-bold text-on-surface text-sm">Aucun membre pour l'instant</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Ajoutez vos vendeurs de guichet et contrôleurs de porte. Ils recevront un accès sécurisé à leurs outils dédiés.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer hover:bg-primary-hover transition-colors"
            >
              Ajouter le premier membre
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant border-b border-outline-variant/20 uppercase tracking-wider font-mono">
                  <th className="p-4">Membre</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-high/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-xs shrink-0 ${m.role === 'SELLER' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'}`}>
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-on-surface text-sm">{m.fullName}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">
                            Ajouté le {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-on-surface-variant">{m.email}</td>
                    <td className="p-4 font-mono text-on-surface-variant">{m.phone || '—'}</td>
                    <td className="p-4"><RoleBadge role={m.role} /></td>
                    <td className="p-4 text-center"><StatusDot active={m.isActive} /></td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-[11px] border border-outline-variant/30 cursor-pointer transition-colors inline-flex items-center gap-1"
                          title={m.isActive ? 'Désactiver' : 'Activer'}
                        >
                          <Power className="w-3 h-3 text-primary" />
                          <span>{m.isActive ? 'Désactiver' : 'Activer'}</span>
                        </button>
                        <button
                          onClick={() => handleRemove(m)}
                          className="p-1.5 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Retirer de l'équipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-[#0038A8]/20 bg-[#0038A8]/5 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant space-y-1">
          <p className="font-bold text-on-surface">Comment ça marche ?</p>
          <p>Les membres pré-enregistrés ici recevront automatiquement leur rôle (Vendeur ou Contrôleur) lors de leur première connexion avec leur email.</p>
          <p>Un <span className="font-bold text-emerald-600">Vendeur Guichet</span> accède au POS Caisse. Un <span className="font-bold text-violet-600">Contrôleur Porte</span> accède au scanner QR.</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1936] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black">Ajouter un Membre</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vendeur guichet ou contrôleur de porte</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2">
                {(['CONTROLLER', 'SELLER'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${role === r ? (r === 'CONTROLLER' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300') : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-300'}`}
                  >
                    {r === 'CONTROLLER' ? <QrCode className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    <span>{r === 'CONTROLLER' ? 'Contrôleur Porte' : 'Vendeur Guichet'}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Babacar Ndiaye"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Email Professionnel *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="babacar@exemple.sn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Téléphone <span className="font-normal text-slate-400">(optionnel)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#0038A8] hover:bg-[#002D8C] text-white font-bold cursor-pointer shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Enregistrement…</span></> : <><UserPlus className="w-4 h-4" /><span>Ajouter à l'équipe</span></>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
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

// ─────────────────────────────────────────────────────────────
// SUPER_ADMIN — Global User Management View (existing behavior)
// ─────────────────────────────────────────────────────────────
function SuperAdminUsersView() {
  const { users, addUser, toggleUserStatus } = useStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CONTROLLER');
  const [organization, setOrganization] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = InviteUserSchema.safeParse({ fullName, email, phone, role, organization });
    if (!validation.success) { showToast(validation.error.issues[0]?.message || 'Informations invalides'); return; }
    const validData = validation.data;
    const generatedId = `usr-${Date.now()}`;
    await syncUserProfile(generatedId, validData.email, validData.fullName, validData.role as UserRole);
    addUser({ fullName: validData.fullName, email: validData.email, phone: validData.phone || '+221 77 000 00 00', role: validData.role as UserRole, organization: validData.organization || 'Jël Tix SAS', isActive: true });
    showToast(`Utilisateur ${validData.fullName} invité avec succès !`);
    setShowInviteModal(false);
    setFullName(''); setEmail(''); setPhone('');
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {toast && <Toast message={toast} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Gestion des Utilisateurs &amp; Rôles</h1>
          <p className="text-sm text-on-surface-variant">Super Administrateurs, Organisateurs certifiés, Vendeurs de guichet et Agents de contrôle Jël Tix.</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-md cursor-pointer">
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un Utilisateur / Agent</span>
        </button>
      </div>

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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs">{usr.fullName.charAt(0)}</div>
                      <div>
                        <p className="font-extrabold text-on-surface text-sm">{usr.fullName}</p>
                        <p className="text-[11px] text-on-surface-variant font-mono">{usr.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono text-on-surface-variant">{usr.email}</td>
                  <td className="p-4 text-xs font-medium text-on-surface">{usr.organization || 'Jël Tix SAS'}</td>
                  <td className="p-4"><RoleBadge role={usr.role} /></td>
                  <td className="p-4 text-center"><StatusDot active={usr.isActive} /></td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => { toggleUserStatus(usr.id); showToast(`Statut de ${usr.fullName} modifié.`); }}
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

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1936] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-black">Ajouter un Membre / Contrôleur</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Nom Complet *</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Babacar Ndiaye" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Email Professionnel *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: babacar@jeltix.sn" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Numéro de Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77..." className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Rôle Système</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none font-bold cursor-pointer">
                    <option value="CONTROLLER">Contrôleur Porte</option>
                    <option value="SELLER">Vendeur Guichet</option>
                    <option value="ORGANIZER">Organisateur</option>
                    <option value="FINANCE">Finance &amp; Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Organisation / Poste</label>
                  <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Stade Abdoulaye Wade" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 outline-none" />
                </div>
              </div>
              <div className="pt-3 flex gap-2">
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0038A8] hover:bg-[#002D8C] text-white font-bold cursor-pointer shadow-md">Confirmer l'Invitation</button>
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 font-bold cursor-pointer">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root Page — Routes to correct view based on role
// ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { currentUser } = useStore();
  const role = currentUser?.role;

  // Access denied for non-admin roles
  if (currentUser && role !== 'SUPER_ADMIN' && role !== 'ORGANIZER') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-on-surface mb-2">Accès Restreint</h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          La gestion des utilisateurs et des permissions est réservée aux Organisateurs et Super Administrateurs.
        </p>
        <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Retourner au Tableau de Bord</span>
        </Link>
      </div>
    );
  }

  if (role === 'ORGANIZER' && currentUser?.id) {
    return <OrganizerTeamView organizerId={currentUser.id} organizerName={currentUser.fullName} />;
  }

  return <SuperAdminUsersView />;
}
