// Format utilities for Jël Tix ("Saisissez • Réservez • Profitez")

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return "À l'instant";
  }
  if (diffInSeconds < 60) {
    return `Il y a ${diffInSeconds} sec`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} h`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays} j`;
}

export function formatDateFrench(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateWithDay(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function generateTicketCode(): string {
  const prefix = "JT";
  const num = Math.floor(1000 + Math.random() * 9000);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters.charAt(Math.floor(Math.random() * letters.length));
  return `${prefix}-${num}-${letter}`;
}

export function generateOrderReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMD-JT-${year}-${rand}`;
}
