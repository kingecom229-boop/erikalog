import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Calendar,
  Heart,
  MapPin,
  Maximize2,
  Sparkles,
  Wifi,
} from 'lucide-react';
import type { Property } from '../types/database';
import { useApp } from '../context/AppContext';
import { toggleFavoriteProperty } from '../services/erikalogService';

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  studio: 'Studio',
  appartement: 'Appartement T1/T2',
  chambre: 'Chambre étudiante',
  colocation: 'Colocation',
  residence_etudiante: 'Résidence étudiante',
};

export const PROPERTY_TYPE_LABELS_EN: Record<string, string> = {
  studio: 'Studio',
  appartement: '1/2-Bed Apartment',
  chambre: 'Student Room',
  colocation: 'Shared Flat',
  residence_etudiante: 'Student Residence',
};

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, compact = false }) => {
  const { user, favoritePropertyIds, language, t, refreshState, showToast } = useApp();
  const navigate = useNavigate();

  const isFav = favoritePropertyIds.includes(property.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast(
        t(
          'Connectez-vous pour enregistrer ce logement dans vos favoris.',
          'Sign in to save this listing to your favorites.'
        ),
        'info'
      );
      navigate(`/connexion?redirect=${encodeURIComponent(`/logement/${property.slug}`)}`);
      return;
    }
    const res = await toggleFavoriteProperty(user.id, property.id);
    refreshState();
    showToast(
      res.favorited
        ? t('Logement ajouté à vos favoris.', 'Listing added to your favorites.')
        : t('Logement retiré de vos favoris.', 'Listing removed from your favorites.'),
      'success'
    );
  };

  const formattedDate = new Date(property.available_from).toLocaleDateString(
    language === 'en' ? 'en-GB' : 'fr-FR',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  const typeLabel =
    language === 'en'
      ? PROPERTY_TYPE_LABELS_EN[property.property_type] || property.property_type
      : PROPERTY_TYPE_LABELS[property.property_type] || property.property_type;

  return (
    <Link
      to={`/logement/${property.slug}`}
      className="group bg-white dark:bg-[#0d1b31] rounded-2xl border border-slate-200/90 dark:border-navy-800 overflow-hidden shadow-soft hover:shadow-card hover:border-navy-600 transition-all duration-200 flex flex-col"
    >
      <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100 dark:bg-navy-950">
        <img
          src={property.cover_image_url || undefined}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-transparent to-navy-950/20" />

        <div className="absolute top-3 left-3 right-12 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-navy-800/95 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide">
            {typeLabel}
          </span>
          {property.furnished && (
            <span className="px-2.5 py-1 rounded-lg bg-white/95 text-navy-900 text-[11px] font-bold">
              {t('Meublé', 'Furnished')}
            </span>
          )}
          {property.accepts_visale && (
            <span className="px-2.5 py-1 rounded-lg bg-sage-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Visale</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? t('Retirer des favoris', 'Remove favorite') : t('Ajouter aux favoris', 'Add favorite')}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
            isFav
              ? 'bg-red-500 text-white'
              : 'bg-white/90 hover:bg-white text-slate-700 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight">
                {property.rent_including_charges} €
              </span>
              <span className="text-xs text-slate-200 font-medium">
                {t('/ mois CC', '/ mo incl.')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {property.rent_excluding_charges} € HC + {property.charges_amount} €{' '}
              {t('charges', 'utilities')}
            </p>
          </div>
          {property.eligible_apl && (
            <span className="px-2 py-0.5 rounded bg-navy-900/90 border border-white/20 text-[10px] font-semibold uppercase tracking-wider">
              {t('Éligible APL', 'APL Eligible')}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium text-navy-800 dark:text-navy-300 truncate">
              <MapPin className="w-3.5 h-3.5 text-sage-500 shrink-0" />
              <span className="truncate">
                {property.city_name} ({property.postal_code}) • {property.neighborhood}
              </span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {property.reference}
            </span>
          </div>

          <h3 className="text-base font-bold text-navy-950 dark:text-white group-hover:text-sage-600 transition-colors line-clamp-2 leading-snug">
            {property.title}
          </h3>

          {!compact && property.nearby_schools && property.nearby_schools.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {t('Proche :', 'Near:')} {property.nearby_schools.slice(0, 2).join(', ')}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-navy-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Maximize2 className="w-3.5 h-3.5 text-navy-700 dark:text-sage-400" />
              <span>
                {property.surface_m2} m² • {property.rooms_count}{' '}
                {property.rooms_count > 1 ? t('pièces', 'rooms') : t('pièce', 'room')}
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-sage-500" />
              <span>
                {t('Dispo.', 'Avail.')} {formattedDate}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="inline-flex items-center gap-1 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {property.owner?.account_type === 'real_estate_agent'
                  ? property.owner.company_name || t('Agence partenaire', 'Partner Agency')
                  : t('Propriétaire particulier', 'Private Landlord')}
              </span>
              {property.owner?.is_verified && (
                <BadgeCheck className="w-3.5 h-3.5 text-sage-500 shrink-0" />
              )}
            </span>

            {property.amenities?.includes('wifi_fibre') && (
              <span className="inline-flex items-center gap-1 text-navy-800 dark:text-sage-400 font-semibold shrink-0">
                <Wifi className="w-3 h-3" />
                <span>Fibre</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
