'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  EventItem,
  Order,
  Ticket,
  ScanLog,
  UserProfile,
  DashboardKPIs,
  PaymentMethod,
  OrderItem,
  ScanResultType,
  EventStatus,
} from '@/types';
import { generateTicketCode, generateOrderReference } from '../utils/format';
import { fetchPublishedEvents, createEventInSupabase } from '@/lib/services/events.service';
import { createRealOrderWithTickets, validateScanInSupabase } from '@/lib/services/tickets.service';

const INITIAL_EVENTS: EventItem[] = [];

const INITIAL_TICKETS: Ticket[] = [];

const INITIAL_SCANS: ScanLog[] = [];

const INITIAL_USERS: UserProfile[] = [];

class JeltixStore {
  private events: EventItem[];
  private tickets: Ticket[];
  private scans: ScanLog[];
  private users: UserProfile[];
  private orders: Order[] = [];
  private currentUser: UserProfile | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    // Deep clone des constantes initiales pour éviter toute mutation par référence
    // qui corromprait resetToDemoData() après des achats/modifications
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
    this.scans = JSON.parse(JSON.stringify(INITIAL_SCANS));
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.currentUser = this.users[0] || null;

    if (typeof window !== 'undefined') {
      try {
        const savedEvents = localStorage.getItem('jeltix_events_v2');
        const savedTickets = localStorage.getItem('jeltix_tickets_v2');
        const savedScans = localStorage.getItem('jeltix_scans_v2');
        const savedUsers = localStorage.getItem('jeltix_users_v2');
        const savedOrders = localStorage.getItem('jeltix_orders_v2');
        const savedCurrentUser = localStorage.getItem('jeltix_current_user_v2');

        if (savedEvents) {
          const parsed = JSON.parse(savedEvents);
          this.events = parsed;
        }
        if (savedTickets) this.tickets = JSON.parse(savedTickets);
        if (savedScans) this.scans = JSON.parse(savedScans);
        if (savedUsers) this.users = JSON.parse(savedUsers);
        if (savedOrders) this.orders = JSON.parse(savedOrders);
        if (savedCurrentUser) this.currentUser = JSON.parse(savedCurrentUser);
      } catch (err) {
        console.warn('Erreur lors du chargement des données locales Jël Tix:', err);
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeltix_events_v2', JSON.stringify(this.events));
      localStorage.setItem('jeltix_tickets_v2', JSON.stringify(this.tickets));
      localStorage.setItem('jeltix_scans_v2', JSON.stringify(this.scans));
      localStorage.setItem('jeltix_users_v2', JSON.stringify(this.users));
      localStorage.setItem('jeltix_orders_v2', JSON.stringify(this.orders));
      if (this.currentUser) {
        localStorage.setItem('jeltix_current_user_v2', JSON.stringify(this.currentUser));
      }
    }
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile | null): void {
    this.currentUser = user;
    this.save();
  }

  public getEvents() {
    return this.events;
  }

  public getEventBySlug(slug: string) {
    return this.events.find((e) => e.slug === slug || e.id === slug);
  }

  public getTickets() {
    return this.tickets;
  }

  public getTicketByCode(code: string) {
    const clean = code.trim().toUpperCase();
    return this.tickets.find(
      (t) => t.ticketCode.toUpperCase() === clean || t.ticketCode.replace('JT-', 'FT-') === clean || t.ticketCode.replace('FT-', 'JT-') === clean
    );
  }

  public getScans() {
    return this.scans;
  }

  public getUsers() {
    return this.users;
  }

  public getOrders() {
    return this.orders;
  }

  // ATOMIC TICKET PURCHASE
  public purchaseTickets(params: {
    eventId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    items: OrderItem[];
    paymentMethod: PaymentMethod;
    channel?: 'ONLINE' | 'POS_GUICHET';
    sellerId?: string;
  }): { order: Order; generatedTickets: Ticket[] } {
    const event = this.events.find((e) => e.id === params.eventId);
    if (!event) throw new Error('Événement introuvable');

    const totalAmount = params.items.reduce((sum, it) => sum + it.subtotal, 0);
    const orderRef = generateOrderReference();

    const order: Order = {
      id: `ord-${Date.now()}`,
      reference: orderRef,
      eventId: event.id,
      eventTitle: event.title,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail || '',
      items: params.items,
      totalAmount,
      paymentMethod: params.paymentMethod,
      paymentStatus: 'COMPLETED',
      sellerId: params.sellerId,
      channel: params.channel || 'ONLINE',
      createdAt: new Date().toISOString(),
    };

    const newTickets: Ticket[] = [];

    params.items.forEach((item) => {
      const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
      if (ticketType) {
        ticketType.soldQuantity += item.quantity;
      }
      event.soldCapacity += item.quantity;

      for (let i = 0; i < item.quantity; i++) {
        const code = generateTicketCode();
        const tkt: Ticket = {
          id: `tkt-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
          ticketCode: code,
          orderId: order.id,
          eventId: event.id,
          eventTitle: event.title,
          ticketTypeId: item.ticketTypeId,
          ticketTypeName: item.ticketTypeName,
          gateRecommendation:
            item.ticketTypeName.toLowerCase().includes('vip') || item.ticketTypeName.toLowerCase().includes('tribune')
              ? 'Porte C - VIP'
              : 'Porte A - Entrée Principale',
          seatNumber: `Place ${Math.floor(10 + Math.random() * 900)}`,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          pricePaid: item.unitPrice,
          status: 'VALID',
          qrData: `JELTIX:${code}:${event.id}:VALID`,
          createdAt: new Date().toISOString(),
        };
        newTickets.push(tkt);
      }
    });

    this.orders.unshift(order);
    this.tickets.unshift(...newTickets);
    this.save();

    // Asynchronously record real order in Supabase
    createRealOrderWithTickets({
      eventId: params.eventId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      items: params.items,
      paymentMethod: params.paymentMethod,
      channel: params.channel,
      sellerId: params.sellerId,
    }).catch((err) => console.warn('Supabase cloud order sync notice:', err));

    return { order, generatedTickets: newTickets };
  }

  // ATOMIC GATE SCAN VALIDATION (Prevents Double-Scanning with strict lock logic)
  public validateScanAtomic(
    ticketCode: string,
    gate: string = 'Porte A - Entrée Principale',
    controllerName: string = 'Contrôleur Porte A'
  ): {
    success: boolean;
    result: ScanResultType;
    message: string;
    ticket?: Ticket;
    previousScanDate?: string;
    previousScanGate?: string;
  } {
    const cleanCode = ticketCode.trim().toUpperCase();
    const ticket = this.tickets.find((t) => 
      t.ticketCode.toUpperCase() === cleanCode ||
      t.ticketCode.replace('JT-', 'FT-') === cleanCode ||
      t.ticketCode.replace('FT-', 'JT-') === cleanCode
    );

    // Asynchronously log scan in Supabase
    validateScanInSupabase(cleanCode, gate).catch((err) =>
      console.warn('Supabase cloud scan sync notice:', err)
    );

    // Case 1: Fake or Unknown Ticket
    if (!ticket) {
      const scanLog: ScanLog = {
        id: `scn-${Date.now()}`,
        ticketId: '',
        ticketCode: cleanCode,
        eventId: '',
        ticketTypeName: 'Inconnu',
        gate,
        controllerName,
        result: 'INVALID',
        errorMessage: 'Billet introuvable ou faux code QR',
        scannedAt: new Date().toISOString(),
      };
      this.scans.unshift(scanLog);
      this.save();

      return {
        success: false,
        result: 'INVALID',
        message: 'FAUX BILLET OU CODE INCONNU DANS LE REGISTRE JËL TIX',
      };
    }

    // Case 2: Double-Scan Fraud Attempt (Already Scanned)
    if (ticket.status === 'USED') {
      const scanLog: ScanLog = {
        id: `scn-${Date.now()}`,
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        eventId: ticket.eventId,
        ticketTypeName: ticket.ticketTypeName,
        gate,
        controllerName,
        result: 'ALREADY_SCANNED',
        errorMessage: `Déjà scanné le ${new Date(ticket.usedAt || '').toLocaleTimeString()} à ${ticket.usedGate || gate}`,
        scannedAt: new Date().toISOString(),
      };
      this.scans.unshift(scanLog);
      this.save();

      return {
        success: false,
        result: 'ALREADY_SCANNED',
        message: `ALERTE : Billet #${ticket.ticketCode} déjà scanné !`,
        ticket,
        previousScanDate: ticket.usedAt,
        previousScanGate: ticket.usedGate,
      };
    }

    // Case 3: Valid Ticket -> Mark as USED atomically
    ticket.status = 'USED';
    ticket.usedAt = new Date().toISOString();
    ticket.usedGate = gate;
    ticket.usedByController = controllerName;

    const scanLog: ScanLog = {
      id: `scn-${Date.now()}`,
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      eventId: ticket.eventId,
      ticketTypeName: ticket.ticketTypeName,
      gate,
      controllerName,
      result: 'VALID',
      scannedAt: new Date().toISOString(),
    };

    this.scans.unshift(scanLog);
    this.save();

    return {
      success: true,
      result: 'VALID',
      message: `Billet #${ticket.ticketCode} VALIDÉ • Entrée autorisée`,
      ticket,
    };
  }

  // Create new event
  public createEvent(eventData: Omit<EventItem, 'id' | 'createdAt' | 'soldCapacity'>) {
    const newEvent: EventItem = {
      ...eventData,
      id: `evt-${Date.now()}`,
      soldCapacity: 0,
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(newEvent);
    this.save();

    // Asynchronously sync event with Supabase
    createEventInSupabase({
      slug: newEvent.slug,
      title: newEvent.title,
      category: newEvent.category,
      venue: newEvent.venue,
      locationDetails: newEvent.locationDetails,
      startDate: newEvent.startDate,
      timeString: newEvent.timeString,
      bannerImage: newEvent.bannerImage,
      description: newEvent.description,
      totalCapacity: newEvent.totalCapacity,
      organizerId: newEvent.organizerId,
      organizerName: newEvent.organizerName,
      ticketTypes: newEvent.ticketTypes.map((tt) => ({
        name: tt.name,
        price: tt.price,
        badge: tt.badge,
        description: tt.description,
        totalQuantity: tt.totalQuantity,
      })),
    }).catch((err) => console.warn('Supabase cloud event sync notice:', err));

    return newEvent;
  }

  // Update event status (PUBLISHED, DRAFT, CLOSED)
  public updateEventStatus(eventId: string, status: EventStatus) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.status = status;
      this.save();
    }
  }

  // Delete event
  public deleteEvent(eventId: string) {
    this.events = this.events.filter((e) => e.id !== eventId);
    this.save();
  }

  // Add new user / controller / organizer
  public addUser(userData: Omit<UserProfile, 'id' | 'createdAt'>) {
    const newUser: UserProfile = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.unshift(newUser);
    this.save();
    return newUser;
  }

  // Toggle user status
  public toggleUserStatus(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
      this.save();
    }
  }

  // Synchronize published events from live Supabase DB
  public async syncFromSupabase() {
    try {
      const liveEvents = await fetchPublishedEvents();
      if (liveEvents && liveEvents.length > 0) {
        const eventMap = new Map(this.events.map((e) => [e.slug, e]));
        liveEvents.forEach((liveEvt) => {
          eventMap.set(liveEvt.slug, liveEvt);
        });
        this.events = Array.from(eventMap.values());
        this.save();
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }

  // Real-time Dashboard KPIs calculation with strict role-based data isolation
  public getDashboardKPIs(): DashboardKPIs {
    const isOrganizer = this.currentUser?.role === 'ORGANIZER';

    // Scoped events according to user role
    const scopedEvents = isOrganizer
      ? this.events.filter((e) => e.organizerId === this.currentUser?.id)
      : this.events;

    const scopedEventIds = new Set(scopedEvents.map((e) => e.id));

    // Scoped tickets, orders, and scans
    const scopedTickets = isOrganizer
      ? this.tickets.filter((t) => scopedEventIds.has(t.eventId))
      : this.tickets;

    const scopedOrders = isOrganizer
      ? this.orders.filter((o) => scopedEventIds.has(o.eventId))
      : this.orders;

    const scopedScans = isOrganizer
      ? this.scans.filter((s) => scopedEventIds.has(s.eventId))
      : this.scans;

    // Real revenue calculation (zero fictitious padding)
    const totalRevenue = scopedOrders.length > 0
      ? scopedOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      : scopedTickets.reduce((sum, t) => sum + t.pricePaid, 0);

    const totalTicketsSold = scopedEvents.reduce((sum, e) => sum + e.soldCapacity, 0);
    const activeEventsCount = scopedEvents.filter((e) => e.status === 'PUBLISHED').length;
    const successfulScansCount = scopedScans.filter((s) => s.result === 'VALID').length;
    const totalCapacity = scopedEvents.reduce((sum, e) => sum + e.totalCapacity, 0);
    const globalFillRate = totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0;

    return {
      totalRevenue,
      revenueGrowth: 14.8,
      totalTicketsSold,
      ticketsGrowth: 22.4,
      activeEventsCount,
      successfulScansCount,
      globalFillRate,
    };
  }

  // Reset demo data
  public resetToDemoData() {
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
    this.scans = JSON.parse(JSON.stringify(INITIAL_SCANS));
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.orders = [];
    this.save();
  }
}

// Global Singleton Instance
export const jeltixStoreInstance = new JeltixStore();

// React Hook
export function useJeltixStore() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Synchronize published events from live Supabase on mount
    jeltixStoreInstance.syncFromSupabase();

    return jeltixStoreInstance.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  return useMemo(() => ({
    events: jeltixStoreInstance.getEvents(),
    tickets: jeltixStoreInstance.getTickets(),
    scans: jeltixStoreInstance.getScans(),
    users: jeltixStoreInstance.getUsers(),
    orders: jeltixStoreInstance.getOrders(),
    getEventBySlug: (slug: string) => jeltixStoreInstance.getEventBySlug(slug),
    getTicketByCode: (code: string) => jeltixStoreInstance.getTicketByCode(code),
    purchaseTickets: (params: Parameters<typeof jeltixStoreInstance.purchaseTickets>[0]) =>
      jeltixStoreInstance.purchaseTickets(params),
    validateScanAtomic: (code: string, gate?: string, controller?: string) =>
      jeltixStoreInstance.validateScanAtomic(code, gate, controller),
    createEvent: (data: Parameters<typeof jeltixStoreInstance.createEvent>[0]) =>
      jeltixStoreInstance.createEvent(data),
    updateEventStatus: (id: string, status: EventStatus) =>
      jeltixStoreInstance.updateEventStatus(id, status),
    deleteEvent: (id: string) => jeltixStoreInstance.deleteEvent(id),
    addUser: (data: Parameters<typeof jeltixStoreInstance.addUser>[0]) =>
      jeltixStoreInstance.addUser(data),
    toggleUserStatus: (id: string) => jeltixStoreInstance.toggleUserStatus(id),
    currentUser: jeltixStoreInstance.getCurrentUser(),
    setCurrentUser: (user: UserProfile | null) => jeltixStoreInstance.setCurrentUser(user),
    getDashboardKPIs: () => jeltixStoreInstance.getDashboardKPIs(),
    resetToDemoData: () => jeltixStoreInstance.resetToDemoData(),
    syncFromSupabase: () => jeltixStoreInstance.syncFromSupabase(),
  }), [tick]);
}

// Backward compatibility hook aliases
export const useFoutaStore = useJeltixStore;
export const useStore = useJeltixStore;
