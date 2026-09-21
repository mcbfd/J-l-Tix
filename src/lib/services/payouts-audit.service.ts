import { createClient } from '@/lib/supabase/client';
import { WithdrawalRequest, AuditLogEntry } from '@/types';

const WITHDRAWALS_STORAGE_KEY = 'jeltix_withdrawal_requests_v1';
const AUDIT_LOGS_STORAGE_KEY = 'jeltix_audit_logs_v1';

// Initial mock data if empty
const DEFAULT_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wdr-101',
    organizerId: 'org-1',
    organizerName: 'Dakar Music Group',
    organizerEmail: 'amadou@dakarmusic.sn',
    amount: 350000,
    method: 'WAVE',
    phoneNumber: '+221 77 123 45 67',
    status: 'PAID',
    requestedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    note: 'Retrait recettes pré-ventes Dakar Music Festival',
  },
  {
    id: 'wdr-102',
    organizerId: 'org-2',
    organizerName: 'Teranga Event Production',
    organizerEmail: 'contact@terangaevents.sn',
    amount: 180000,
    method: 'ORANGE_MONEY',
    phoneNumber: '+221 78 987 65 43',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    note: 'Avance billetterie Gala Teranga',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    action: 'CONNEXION_UTILISATEUR',
    performedBy: 'admin@jeltix.sn (Super Admin)',
    target: 'Session Plateforme',
    details: 'Connexion réussie depuis IP autorisée',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    ipAddress: '196.207.240.12',
  },
  {
    id: 'audit-002',
    action: 'CREATION_DEMANDE_RETRAIT',
    performedBy: 'contact@terangaevents.sn (Organisateur)',
    target: 'Demande wdr-102',
    details: 'Demande de retrait de 180 000 FCFA via ORANGE_MONEY',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    ipAddress: '154.124.71.55',
  },
  {
    id: 'audit-003',
    action: 'VALIDATION_RETRAIT',
    performedBy: 'admin@jeltix.sn (Super Admin)',
    target: 'Demande wdr-101',
    details: 'Retrait approuvé et marqué payé (350 000 FCFA)',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    ipAddress: '196.207.240.12',
  },
  {
    id: 'audit-004',
    action: 'VENTE_GUICHET_POS',
    performedBy: 'vendeur@jeltix.sn (Vendeur POS)',
    target: 'Commande cmd-pos-992',
    details: 'Encaissement 2x Pass VIP (30 000 FCFA) en ESPÈCES',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    ipAddress: '41.82.170.8',
  },
  {
    id: 'audit-005',
    action: 'SCAN_BILLET_CONTROLE',
    performedBy: 'controleur@jeltix.sn (Scanneur)',
    target: 'Billet JLTX-99812-VIP',
    details: 'Billet scanné et validé à la porte principale (Porte A)',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    ipAddress: '41.82.170.15',
  },
];

function getStoredWithdrawals(): WithdrawalRequest[] {
  if (typeof window === 'undefined') return DEFAULT_WITHDRAWALS;
  try {
    const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(DEFAULT_WITHDRAWALS));
      return DEFAULT_WITHDRAWALS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WITHDRAWALS;
  }
}

function saveStoredWithdrawals(data: WithdrawalRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save withdrawals in localStorage', e);
  }
}

function getStoredAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return DEFAULT_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_AUDIT_LOGS;
  }
}

function saveStoredAuditLogs(data: AuditLogEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save audit logs in localStorage', e);
  }
}

export async function fetchWithdrawalRequests(organizerId?: string): Promise<WithdrawalRequest[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('withdrawal_requests').select('*').order('requested_at', { ascending: false });
    if (organizerId) {
      query = query.eq('organizer_id', organizerId) as typeof query;
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        organizerId: d.organizer_id,
        organizerName: d.organizer_name || 'Organisateur',
        organizerEmail: d.organizer_email || '',
        amount: Number(d.amount),
        method: d.method,
        phoneNumber: d.phone_number,
        bankDetails: d.bank_details,
        status: d.status,
        requestedAt: d.requested_at,
        processedAt: d.processed_at,
        note: d.note,
      }));
    }
  } catch {
    // Supabase table might not exist yet, fallback to localStorage
  }

  const all = getStoredWithdrawals();
  if (organizerId) {
    return all.filter((w) => w.organizerId === organizerId);
  }
  return all;
}

export async function submitWithdrawalRequest(params: {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  amount: number;
  method: 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';
  phoneNumber?: string;
  bankDetails?: string;
  note?: string;
}): Promise<WithdrawalRequest> {
  const newRequest: WithdrawalRequest = {
    id: `wdr-${Date.now().toString(36)}`,
    ...params,
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    await supabase.from('withdrawal_requests').insert({
      id: newRequest.id,
      organizer_id: newRequest.organizerId,
      organizer_name: newRequest.organizerName,
      organizer_email: newRequest.organizerEmail,
      amount: newRequest.amount,
      method: newRequest.method,
      phone_number: newRequest.phoneNumber,
      bank_details: newRequest.bankDetails,
      status: newRequest.status,
      requested_at: newRequest.requestedAt,
      note: newRequest.note,
    });
  } catch {
    // Supabase table may not exist, fallback continues
  }

  const all = getStoredWithdrawals();
  all.unshift(newRequest);
  saveStoredWithdrawals(all);

  // Record audit log
  await recordAuditLogEntry({
    action: 'DEMANDE_RETRAIT',
    performedBy: `${params.organizerName} (${params.organizerEmail})`,
    target: `Demande ${newRequest.id}`,
    details: `Demande de retrait de ${params.amount.toLocaleString('fr-FR')} FCFA via ${params.method}`,
  });

  return newRequest;
}

export async function updateWithdrawalRequestStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'PAID',
  adminEmail: string
): Promise<WithdrawalRequest | null> {
  let updated: WithdrawalRequest | null = null;
  const processedAt = new Date().toISOString();

  try {
    const supabase = createClient();
    await supabase
      .from('withdrawal_requests')
      .update({ status, processed_at: processedAt })
      .eq('id', id);
  } catch {
    // fallback
  }

  const all = getStoredWithdrawals();
  const index = all.findIndex((w) => w.id === id);
  if (index !== -1) {
    all[index] = {
      ...all[index],
      status,
      processedAt,
    };
    updated = all[index];
    saveStoredWithdrawals(all);

    await recordAuditLogEntry({
      action: status === 'PAID' ? 'PAIEMENT_RETRAIT' : status === 'APPROVED' ? 'APPROBATION_RETRAIT' : 'REJET_RETRAIT',
      performedBy: adminEmail,
      target: `Demande ${id}`,
      details: `Statut mis à jour à ${status} (${all[index].amount.toLocaleString('fr-FR')} FCFA pour ${all[index].organizerName})`,
    });
  }

  return updated;
}

export async function fetchAuditLogs(limit = 25): Promise<AuditLogEntry[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        action: d.action,
        performedBy: d.performed_by,
        target: d.target,
        details: d.details,
        timestamp: d.timestamp,
        ipAddress: d.ip_address,
      }));
    }
  } catch {
    // fallback
  }

  const logs = getStoredAuditLogs();
  return logs.slice(0, limit);
}

export async function recordAuditLogEntry(entry: {
  action: string;
  performedBy: string;
  target?: string;
  details?: string;
  ipAddress?: string;
}): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `audit-${Date.now().toString(36)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    await supabase.from('audit_logs').insert({
      id: newLog.id,
      action: newLog.action,
      performed_by: newLog.performedBy,
      target: newLog.target,
      details: newLog.details,
      timestamp: newLog.timestamp,
      ip_address: newLog.ipAddress,
    });
  } catch {
    // fallback
  }

  const logs = getStoredAuditLogs();
  logs.unshift(newLog);
  saveStoredAuditLogs(logs);

  return newLog;
}
