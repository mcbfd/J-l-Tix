import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { EventCatalog } from '@/components/home/EventCatalog';
import { FeaturedSpotlight } from '@/components/home/FeaturedSpotlight';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tous les Événements • Billetterie Jël Tix Sénégal',
  description: 'Découvrez tous les concerts, matchs de football, pièces de théâtre et galas disponibles au Sénégal. Paiement sécurisé via Wave et Orange Money.',
};

export default function PublicEventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface selection:bg-[#4EED15] selection:text-[#002D8C]">
      <PublicHeader />

      <main className="flex-1 w-full">
        {/* Spotlight top */}
        <FeaturedSpotlight />

        {/* Catalog */}
        <EventCatalog />
      </main>

      <Footer />
    </div>
  );
}
