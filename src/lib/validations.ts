import { z } from 'zod';

export const CheckoutSchema = z.object({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom est trop long"),
  customerPhone: z.string().regex(/^\+?[0-9\s]{8,15}$/, "Numéro de téléphone invalide"),
  customerEmail: z.string().email("Adresse email invalide").optional().or(z.literal("")),
  paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "FREE_MONEY", "CASH"]),
  items: z.array(
    z.object({
      ticketTypeId: z.string(),
      quantity: z.number().int().min(1).max(10)
    })
  ).min(1, "La commande doit contenir au moins un article"),
});

export const InviteUserSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["CONTROLLER", "SELLER", "ORGANIZER", "FINANCE", "SUPER_ADMIN"]),
  organization: z.string().optional().or(z.literal(""))
});

export const TicketCodeSchema = z.string().min(3, "Le code billet doit contenir au moins 3 caractères");

