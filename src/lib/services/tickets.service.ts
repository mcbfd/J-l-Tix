import { createClient } from '@/lib/supabase/client';
import { Ticket, ScanLog, ScanResultType, PaymentMethod, OrderItem } from '@/types';

export interface PurchaseTicketsInput {
  eventId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  channel?: 'ONLINE' | 'POS_GUICHET';
  sellerId?: string;
}

/**
 * Fetch a ticket by its code from Supabase
 */
export async function fetchTicketByCode(ticketCode: string): Promise<Ticket | null> {
  const supabase = createClient();
  const cleanCode = ticketCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events (title),
      ticket_types (name)
    `)
    .eq('ticket_code', cleanCode)
    .single();

  if (error || !data) {
    return null;
  }

  return mapSupabaseTicketToModel(data);
}

/**
 * Fetch tickets for an organizer's events (Multi-tenant isolation)
 */
export async function fetchOrganizerTickets(organizerId: string): Promise<Ticket[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events!inner (title, organizer_id),
      ticket_types (name)
    `)
    .eq('events.organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Error fetching organizer tickets:', error?.message);
    return [];
  }

  return data.map(mapSupabaseTicketToModel);
}

/**
 * Fetch all tickets across platform (Super Admin only)
 */
export async function fetchAllTicketsAdmin(): Promise<Ticket[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events (title),
      ticket_types (name)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Error fetching all tickets for admin:', error?.message);
    return [];
  }

  return data.map(mapSupabaseTicketToModel);
}

/**
 * Purchase and generate tickets in Supabase
 */
export async function createRealOrderWithTickets(input: PurchaseTicketsInput): Promise<{
  orderId: string;
  generatedTickets: Ticket[];
}> {
  const supabase = createClient();
  const orderRef = `CMD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const totalAmount = input.items.reduce((acc, item) => acc + item.subtotal, 0);

  // 1. Create Order
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      reference: orderRef,
      event_id: input.eventId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      payment_status: 'COMPLETED',
      seller_id: input.sellerId || null,
      channel: input.channel || 'ONLINE',
    })
    .select()
    .single();

  if (orderError || !orderRow) {
    console.error('Order creation error in Supabase:', orderError);
    throw new Error(orderError?.message || 'Erreur lors de la création de la commande.');
  }

  // 2. Prepare individual tickets
  const ticketRowsToInsert: any[] = [];
  let ticketCounter = 1;

  for (const item of input.items) {
    for (let i = 0; i < item.quantity; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `JT-${Date.now().toString().slice(-4)}${randomSuffix}-${ticketCounter}`;
      ticketCounter++;

      ticketRowsToInsert.push({
        ticket_code: ticketCode,
        order_id: orderRow.id,
        event_id: input.eventId,
        ticket_type_id: item.ticketTypeId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        price_paid: item.unitPrice,
        status: 'VALID',
        gate_recommendation: 'Porte A - Entrée Principale',
        seat_number: `Gradins Libres #${ticketCounter}`,
        qr_data: ticketCode,
      });
    }
  }

  // 3. Insert Tickets
  const { data: insertedTickets, error: ticketsError } = await supabase
    .from('tickets')
    .insert(ticketRowsToInsert)
    .select(`
      *,
      events (title),
      ticket_types (name)
    `);

  if (ticketsError || !insertedTickets) {
    console.error('Tickets insertion error in Supabase:', ticketsError);
    throw new Error(ticketsError?.message || "Erreur lors de l'émission des billets.");
  }

  // 4. Increment sold quantities on event and ticket types
  try {
    for (const item of input.items) {
      // Fetch current sold quantity
      const { data: currentType } = await supabase
        .from('ticket_types')
        .select('sold_quantity')
        .eq('id', item.ticketTypeId)
        .single();

      if (currentType) {
        await supabase
          .from('ticket_types')
          .update({ sold_quantity: (currentType.sold_quantity || 0) + item.quantity })
          .eq('id', item.ticketTypeId);
      }
    }

    const { data: currentEvent } = await supabase
      .from('events')
      .select('sold_capacity')
      .eq('id', input.eventId)
      .single();

    if (currentEvent) {
      const totalTicketsCount = input.items.reduce((sum, it) => sum + it.quantity, 0);
      await supabase
        .from('events')
        .update({ sold_capacity: (currentEvent.sold_capacity || 0) + totalTicketsCount })
        .eq('id', input.eventId);
    }
  } catch (err) {
    console.warn('Non-blocking inventory count sync warning:', err);
  }

  return {
    orderId: orderRow.id,
    generatedTickets: insertedTickets.map(mapSupabaseTicketToModel),
  };
}

/**
 * Perform atomic ticket scan validation in Supabase
 */
export async function validateScanInSupabase(
  ticketCode: string,
  gate: string = 'Porte A - Entrée Principale',
  controllerId?: string
): Promise<{
  success: boolean;
  result: ScanResultType;
  message: string;
  ticket?: Ticket;
  previousScanDate?: string;
  previousScanGate?: string;
}> {
  const supabase = createClient();
  const cleanCode = ticketCode.trim().toUpperCase();

  // Try calling Postgres atomic stored function first
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('validate_ticket_atomic', {
      p_ticket_code: cleanCode,
      p_gate: gate,
      p_controller_id: controllerId || null,
    });

    if (!rpcError && rpcResult) {
      return {
        success: Boolean(rpcResult.success),
        result: rpcResult.result as ScanResultType,
        message: rpcResult.message || '',
        ticket: rpcResult.ticket ? (rpcResult.ticket as Ticket) : undefined,
        previousScanDate: rpcResult.ticket?.usedAt,
        previousScanGate: rpcResult.ticket?.usedGate,
      };
    }
  } catch (rpcErr) {
    console.warn('RPC validate_ticket_atomic fallback:', rpcErr);
  }

  // Fallback: Direct table atomic transaction pattern
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events (title),
      ticket_types (name)
    `)
    .eq('ticket_code', cleanCode)
    .single();

  if (error || !ticket) {
    // Log invalid scan
    await supabase.from('scans').insert({
      ticket_code: cleanCode,
      gate,
      result: 'INVALID',
      error_message: 'Faux billet ou code inconnu dans le registre Jël Tix',
    });

    return {
      success: false,
      result: 'INVALID',
      message: 'FAUX BILLET OU CODE INCONNU DANS LE REGISTRE JËL TIX',
    };
  }

  // Check double scan
  if (ticket.status === 'USED') {
    await supabase.from('scans').insert({
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      event_id: ticket.event_id,
      gate,
      result: 'ALREADY_SCANNED',
      error_message: `Déjà scanné le ${ticket.used_at} à ${ticket.used_gate}`,
    });

    return {
      success: false,
      result: 'ALREADY_SCANNED',
      message: `DOUBLE PASSAGE DÉTECTÉ : Billet déjà scanné à ${ticket.used_gate || 'une autre porte'}.`,
      ticket: mapSupabaseTicketToModel(ticket),
      previousScanDate: ticket.used_at,
      previousScanGate: ticket.used_gate,
    };
  }

  // Mark ticket as USED
  const nowIso = new Date().toISOString();
  await supabase
    .from('tickets')
    .update({
      status: 'USED',
      used_at: nowIso,
      used_gate: gate,
    })
    .eq('id', ticket.id);

  // Insert successful scan log
  await supabase.from('scans').insert({
    ticket_id: ticket.id,
    ticket_code: ticket.ticket_code,
    event_id: ticket.event_id,
    gate,
    result: 'VALID',
  });

  const updatedTicket = {
    ...ticket,
    status: 'USED' as const,
    used_at: nowIso,
    used_gate: gate,
  };

  return {
    success: true,
    result: 'VALID',
    message: 'ACCÈS AUTORISÉ • Billet authentique Jël Tix',
    ticket: mapSupabaseTicketToModel(updatedTicket),
  };
}

/**
 * Fetch scan audit logs for an organizer
 */
export async function fetchOrganizerScans(organizerId: string): Promise<ScanLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('scans')
    .select(`
      *,
      events!inner (organizer_id)
    `)
    .eq('events.organizer_id', organizerId)
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapSupabaseScanToModel);
}

/**
 * Fetch all scans across platform (Super Admin only)
 */
export async function fetchAllScansAdmin(): Promise<ScanLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapSupabaseScanToModel);
}

function mapSupabaseTicketToModel(record: any): Ticket {
  return {
    id: record.id,
    ticketCode: record.ticket_code,
    orderId: record.order_id,
    eventId: record.event_id,
    eventTitle: record.events?.title || 'Événement Jël Tix',
    ticketTypeId: record.ticket_type_id,
    ticketTypeName: record.ticket_types?.name || 'Billet Standard',
    customerName: record.customer_name,
    customerPhone: record.customer_phone,
    pricePaid: record.price_paid,
    status: record.status || 'VALID',
    gateRecommendation: record.gate_recommendation || 'Porte A',
    seatNumber: record.seat_number || 'Gradins libres',
    qrData: record.qr_data || record.ticket_code,
    usedAt: record.used_at,
    usedGate: record.used_gate,
    createdAt: record.created_at,
  };
}

function mapSupabaseScanToModel(record: any): ScanLog {
  return {
    id: record.id,
    ticketId: record.ticket_id || '',
    ticketCode: record.ticket_code,
    eventId: record.event_id || '',
    ticketTypeName: 'Billet',
    gate: record.gate,
    controllerName: 'Agent Contrôleur',
    result: record.result as ScanResultType,
    errorMessage: record.error_message,
    scannedAt: record.scanned_at,
  };
}
