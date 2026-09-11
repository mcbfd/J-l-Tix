export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORGANIZER'
  | 'EVENT_MANAGER'
  | 'SELLER'
  | 'CONTROLLER'
  | 'FINANCE';

export type EventStatus = 'PUBLISHED' | 'DRAFT' | 'CLOSED';
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CASH';
export type ScanResultType = 'VALID' | 'ALREADY_SCANNED' | 'INVALID';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  organization?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string; // e.g. "Standard", "Tribune", "VIP Prestige"
  price: number; // in FCFA
  badge?: string; // e.g. "Populaire", "VIP", "Gradins"
  description: string;
  totalQuantity: number;
  soldQuantity: number;
  isActive: boolean;
}

export type EventCategory =
  | 'Football'
  | 'Basketball'
  | 'Lutte Sénégalaise'
  | 'Concert / Festival'
  | 'Oscars & Soirées Gala'
  | 'Théâtre & Humour'
  | 'Conférence / Salon'
  | 'Autre Événement';

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  venue: string;
  locationDetails: string;
  startDate: string; // ISO string
  timeString: string; // e.g. "18:00 UTC"
  bannerImage: string;
  description: string;
  importantInfo?: string[];
  status: EventStatus;
  totalCapacity: number;
  soldCapacity: number;
  organizerId: string;
  organizerName: string;
  ticketTypes: TicketType[];
  createdAt: string;
}

export interface OrderItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  reference: string; // e.g. "CMD-2026-9812"
  eventId: string;
  eventTitle: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  sellerId?: string; // If sold via POS Guichet
  channel: 'ONLINE' | 'POS_GUICHET';
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketCode: string; // e.g. "FT-8921-X"
  orderId: string;
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  gateRecommendation: string; // e.g. "Porte A - Entrée Principale"
  seatNumber?: string;
  customerName: string;
  customerPhone: string;
  pricePaid: number;
  status: TicketStatus;
  qrData: string; // Cryptographic validation string
  usedAt?: string;
  usedGate?: string;
  usedByController?: string;
  createdAt: string;
}

export interface ScanLog {
  id: string;
  ticketId: string;
  ticketCode: string;
  eventId: string;
  ticketTypeName: string;
  gate: string; // e.g. "Porte A - Entrée Principale"
  controllerName: string;
  result: ScanResultType;
  scannedAt: string; // ISO string
  errorMessage?: string;
}

export interface POSCartItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DashboardKPIs {
  totalRevenue: number;
  revenueGrowth: number;
  totalTicketsSold: number;
  ticketsGrowth: number;
  activeEventsCount: number;
  successfulScansCount: number;
  globalFillRate: number;
}
