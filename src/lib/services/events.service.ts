import { createClient } from '@/lib/supabase/client';
import { Event, TicketType } from '@/types';

export interface CreateEventInput {
  slug: string;
  title: string;
  category: string;
  venue: string;
  locationDetails: string;
  startDate: string;
  timeString?: string;
  bannerImage: string;
  description: string;
  totalCapacity: number;
  organizerId: string;
  organizerName: string;
  ticketTypes: Array<{
    name: string;
    price: number;
    badge?: string;
    description?: string;
    totalQuantity: number;
  }>;
}

/**
 * Fetch all published events for public visitors (Home page & Catalog)
 */
export async function fetchPublishedEvents(): Promise<Event[]> {
  const supabase = createClient();

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (*)
    `)
    .eq('status', 'PUBLISHED')
    .order('start_date', { ascending: true });

  if (eventsError || !eventsData) {
    console.warn('Error fetching published events from Supabase:', eventsError?.message);
    return [];
  }

  return eventsData.map(mapSupabaseEventToModel);
}

/**
 * Fetch events belonging to a specific organizer (Multi-tenant isolation)
 */
export async function fetchOrganizerEvents(organizerId: string): Promise<Event[]> {
  const supabase = createClient();

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (*)
    `)
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (eventsError || !eventsData) {
    console.warn('Error fetching organizer events:', eventsError?.message);
    return [];
  }

  return eventsData.map(mapSupabaseEventToModel);
}

/**
 * Fetch all events across platform (Super Admin only)
 */
export async function fetchAllEventsAdmin(): Promise<Event[]> {
  const supabase = createClient();

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (*)
    `)
    .order('created_at', { ascending: false });

  if (eventsError || !eventsData) {
    console.warn('Error fetching all events for admin:', eventsError?.message);
    return [];
  }

  return eventsData.map(mapSupabaseEventToModel);
}

/**
 * Fetch a single event by slug (Public event page)
 */
export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (*)
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapSupabaseEventToModel(data);
}

/**
 * Create a real event with ticket tiers in Supabase
 */
export async function createEventInSupabase(input: CreateEventInput): Promise<Event | null> {
  const supabase = createClient();

  // 1. Insert Event
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .insert({
      slug: input.slug,
      title: input.title,
      category: input.category,
      venue: input.venue,
      location_details: input.locationDetails,
      start_date: input.startDate,
      banner_image: input.bannerImage,
      description: input.description,
      status: 'PUBLISHED',
      total_capacity: input.totalCapacity,
      sold_capacity: 0,
      organizer_id: input.organizerId,
    })
    .select()
    .single();

  if (eventError || !eventRow) {
    console.error('Failed to create event in Supabase:', eventError);
    throw new Error(eventError?.message || "Erreur lors de l'enregistrement de l'événement.");
  }

  // 2. Insert Ticket Types
  const ticketTypeInserts = input.ticketTypes.map((tt) => ({
    event_id: eventRow.id,
    name: tt.name,
    price: tt.price,
    badge: tt.badge || null,
    description: tt.description || '',
    total_quantity: tt.totalQuantity,
    sold_quantity: 0,
    is_active: true,
  }));

  const { data: ticketTypesRows, error: ttError } = await supabase
    .from('ticket_types')
    .insert(ticketTypeInserts)
    .select();

  if (ttError) {
    console.warn('Warning inserting ticket types:', ttError);
  }

  return mapSupabaseEventToModel({
    ...eventRow,
    ticket_types: ticketTypesRows || [],
  });
}

/**
 * Transform DB snake_case record to TypeScript Event model
 */
function mapSupabaseEventToModel(record: any): Event {
  const ticketTypes: TicketType[] = (record.ticket_types || []).map((tt: any) => ({
    id: tt.id,
    eventId: tt.event_id,
    name: tt.name,
    price: tt.price,
    badge: tt.badge || '',
    description: tt.description || '',
    totalQuantity: tt.total_quantity,
    soldQuantity: tt.sold_quantity || 0,
    isActive: tt.is_active !== false,
  }));

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    category: record.category,
    venue: record.venue,
    locationDetails: record.location_details || '',
    startDate: record.start_date,
    timeString: new Date(record.start_date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' UTC',
    bannerImage: record.banner_image,
    description: record.description || '',
    importantInfo: [],
    status: record.status || 'PUBLISHED',
    totalCapacity: record.total_capacity,
    soldCapacity: record.sold_capacity || 0,
    organizerId: record.organizer_id,
    organizerName: 'Organisateur Officiel',
    ticketTypes,
    createdAt: record.created_at,
  };
}
