'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJeltixStore } from '@/lib/store/jeltix-store';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Calendar, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import type { EventCategory } from '@/types';

export default function NewEventPage() {
  const router = useRouter();
  const { createEvent } = useJeltixStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Football');
  const [venue, setVenue] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timeString, setTimeString] = useState('18:00 UTC');
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80'
  );
  const [description, setDescription] = useState('');
  const [totalCapacity, setTotalCapacity] = useState(25000);

  // Ticket Categories
  const [ticketTypes, setTicketTypes] = useState([
    {
      id: 'tt-custom-1',
      eventId: '',
      name: 'Billet Standard (Gradins)',
      price: 300,
      badge: 'Populaire',
      description: 'Accès aux gradins généraux. Placement libre.',
      totalQuantity: 20000,
      soldQuantity: 0,
      isActive: true,
    },
    {
      id: 'tt-custom-2',
      eventId: '',
      name: 'Billet Tribune Couverte',
      price: 500,
      badge: 'VIP',
      description: 'Accès tribune couverte avec assise numérotée.',
      totalQuantity: 5000,
      soldQuantity: 0,
      isActive: true,
    },
  ]);

  const handleAddTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        id: `tt-custom-${Date.now()}`,
        eventId: '',
        name: 'Nouvelle Catégorie',
        price: 1000,
        badge: 'Accès Spécial',
        description: 'Description du billet.',
        totalQuantity: 1000,
        soldQuantity: 0,
        isActive: true,
      },
    ]);
  };

  const handleRemoveTicketType = (index: number) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue || !startDate) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    createEvent({
      slug,
      title,
      category,
      venue,
      locationDetails: locationDetails || 'Dakar, Sénégal',
      startDate: new Date(startDate).toISOString(),
      timeString: timeString || '18:00 UTC',
      bannerImage,
      description: description || `Événement majeur organisé au ${venue}.`,
      status: 'PUBLISHED',
      totalCapacity: Number(totalCapacity),
      organizerId: 'usr-1',
      organizerName: 'Admin Principal / Fédération',
      ticketTypes: ticketTypes.map((tt, idx) => ({
        ...tt,
        id: `tt-${Date.now()}-${idx}`,
      })),
    });

    router.push('/events');
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/events"
          className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">Créer un Nouvel Événement</h1>
          <p className="text-xs text-on-surface-variant">
            Renseignez les détails, la date et la configuration tarifaire des billets Jël Tix.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info Card */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 space-y-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Informations Générales de l'Événement</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Titre de l'Événement *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Demi-Finale Coupe du Sénégal : Jaraaf vs Teungueth"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Discipline / Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Football">Football & Navétanes</option>
                <option value="Basketball">Basketball D1 / BAL</option>
                <option value="Lutte Sénégalaise">Lutte Sénégalaise</option>
                <option value="Concert / Festival">Concert / Festival</option>
                <option value="Oscars & Soirées Gala">Oscars & Soirées Gala</option>
                <option value="Théâtre & Humour">Théâtre & Humour</option>
                <option value="Conférence / Salon">Conférence / Salon</option>
                <option value="Autre Événement">Autre Événement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Stade / Lieu *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Ex: Stade Abdoulaye Wade"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Ville / Quartier *
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="Ex: Diamniadio, Dakar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Date de l'Événement *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Heure Affichée (Coup d'envoi)
              </label>
              <input
                type="text"
                value={timeString}
                onChange={(e) => setTimeString(e.target.value)}
                placeholder="Ex: 18:00 UTC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Capacité Totale du Stade
              </label>
              <input
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              URL de l'Image Bannière (Unsplash)
            </label>
            <input
              type="url"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Description de l'Événement
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails du match, artistes, consignes pour les spectateurs..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Ticket Categories Configuration */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-on-surface font-mono">
                Catégories & Tarification des Billets
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Définissez les zones du stade, les quotas et les prix en FCFA.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTicketType}
              className="px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une catégorie</span>
            </button>
          </div>

          <div className="space-y-3">
            {ticketTypes.map((tt, index) => (
              <div
                key={index}
                className="bg-surface p-4 rounded-2xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-on-surface-variant font-mono uppercase mb-1">
                    Nom de la Catégorie
                  </label>
                  <input
                    type="text"
                    value={tt.name}
                    onChange={(e) => {
                      const next = [...ticketTypes];
                      next[index].name = e.target.value;
                      setTicketTypes(next);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-surface-container border border-outline-variant/30 outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-on-surface-variant font-mono uppercase mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={tt.price}
                    onChange={(e) => {
                      const next = [...ticketTypes];
                      next[index].price = Number(e.target.value);
                      setTicketTypes(next);
                    }}
                    className="w-full px-3 py-2 text-xs font-black font-mono rounded-xl bg-surface-container border border-outline-variant/30 outline-none text-primary"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-on-surface-variant font-mono uppercase mb-1">
                    Quota / Quantité
                  </label>
                  <input
                    type="number"
                    value={tt.totalQuantity}
                    onChange={(e) => {
                      const next = [...ticketTypes];
                      next[index].totalQuantity = Number(e.target.value);
                      setTicketTypes(next);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-surface-container border border-outline-variant/30 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTicketType(index)}
                      className="p-2 rounded-xl text-error hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/events"
            className="px-6 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0038A8] to-[#0D52D6] hover:from-[#002D8C] hover:to-[#0B4FD8] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#4EED15]" />
            <span>Publier l'Événement sur Jël Tix</span>
          </button>
        </div>
      </form>
    </div>
  );
}
