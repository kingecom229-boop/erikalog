import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookmarkPlus,
  Filter,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createSavedSearch,
  getPublicReferenceData,
  searchPublishedProperties,
} from '../services/erikalogService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';
import type { PropertyTypeSlug, SearchFilters } from '../types/database';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, showToast } = useApp();
  const { cities, amenities } = getPublicReferenceData();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filters: SearchFilters = useMemo(() => {
    const amStr = searchParams.get('amenities');
    return {
      query: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      postalCode: searchParams.get('postalCode') || '',
      neighborhood: searchParams.get('neighborhood') || '',
      school: searchParams.get('school') || '',
      propertyType: (searchParams.get('type') as PropertyTypeSlug) || '',
      minBudget: searchParams.get('minBudget') ? Number(searchParams.get('minBudget')) : '',
      maxBudget: searchParams.get('maxBudget') ? Number(searchParams.get('maxBudget')) : '',
      minSurface: searchParams.get('minSurface') ? Number(searchParams.get('minSurface')) : '',
      maxSurface: searchParams.get('maxSurface') ? Number(searchParams.get('maxSurface')) : '',
      furnished: (searchParams.get('furnished') as 'all' | 'true' | 'false') || 'all',
      availableFrom: searchParams.get('availableFrom') || '',
      eligibleApl: searchParams.get('apl') === 'true',
      acceptsVisale: searchParams.get('visale') === 'true',
      amenities: amStr ? amStr.split(',').filter(Boolean) : [],
      sortBy:
        (searchParams.get('sort') as SearchFilters['sortBy']) || 'relevance',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: 6,
    };
  }, [searchParams]);

  const { items, total, page, totalPages } = useMemo(
    () => searchPublishedProperties(filters),
    [filters]
  );

  const updateFilter = (key: string, value: string | boolean | string[]) => {
    const next = new URLSearchParams(searchParams);
    if (
      value === '' ||
      value === false ||
      value === 'all' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      next.delete(key);
    } else if (Array.isArray(value)) {
      next.set(key, value.join(','));
    } else {
      next.set(key, String(value));
    }
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
    showToast('Tous les filtres ont été réinitialisés.', 'info');
  };

  const handleShareSearch = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Lien de la recherche copié dans le presse-papiers !', 'success');
    } catch {
      showToast(`URL de partage : ${url}`, 'info');
    }
  };

  const handleSaveSearch = async () => {
    if (!user) {
      showToast('Connectez-vous pour enregistrer cette recherche et recevoir des alertes.', 'info');
      return;
    }
    const labelParts = [
      filters.city || 'France entière',
      filters.propertyType || 'Tous types',
      filters.maxBudget ? `≤ ${filters.maxBudget} €` : '',
    ].filter(Boolean);
    await createSavedSearch(user.id, labelParts.join(' • '), filters);
    showToast('Recherche enregistrée dans votre espace personnel !', 'success');
  };

  const toggleAmenity = (slug: string) => {
    const current = filters.amenities || [];
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug];
    updateFilter('amenities', next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title={`Rechercher un logement étudiant ${
          filters.city ? `à ${filters.city}` : 'en France'
        } (${total} offres) | ErikaLog`}
        description="Filtrez les studios, résidences étudiantes, appartements et colocations vérifiés par ville, budget charges comprises, surface et équipements."
        canonicalPath="/recherche"
      />

      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-sage-700">
            Moteur de recherche connecté
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-1">
            {filters.city
              ? `Logements étudiants à ${filters.city}`
              : 'Rechercher un logement étudiant en France'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            <strong>{total}</strong> annonce{total > 1 ? 's' : ''} publiée{total > 1 ? 's' : ''} et
            disponible{total > 1 ? 's' : ''} correspondant à vos critères.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSearch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-navy-700 text-xs font-semibold text-navy-950 shadow-sm transition-colors"
          >
            <BookmarkPlus className="w-4 h-4 text-sage-600" />
            <span>Enregistrer cette recherche</span>
          </button>

          <button
            type="button"
            onClick={handleShareSearch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-navy-700 text-xs font-semibold text-navy-950 shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4 text-navy-700" />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          <div className="lg:col-span-2">
            <label
              htmlFor="filter-q"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Recherche libre (école, quartier, mot-clé)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="filter-q"
                type="text"
                value={filters.query || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="Sorbonne, INSA, Quartier Latin..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          
          <div>
            <label
              htmlFor="filter-city"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Ville d’études
            </label>
            <select
              id="filter-city"
              value={filters.city || ''}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-navy-800"
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.department})
                </option>
              ))}
            </select>
          </div>

          
          <div>
            <label
              htmlFor="filter-type"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Type de logement
            </label>
            <select
              id="filter-type"
              value={filters.propertyType || ''}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-navy-800"
            >
              <option value="">Tous les types</option>
              <option value="studio">Studio indépendant</option>
              <option value="appartement">Appartement T1 / T2</option>
              <option value="residence_etudiante">Résidence étudiante</option>
              <option value="colocation">Colocation</option>
              <option value="chambre">Chambre chez l’habitant</option>
            </select>
          </div>

          
          <div>
            <label
              htmlFor="filter-max-budget"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Budget max. CC (€/mois)
            </label>
            <input
              id="filter-max-budget"
              type="number"
              min={200}
              max={3000}
              step={25}
              value={filters.maxBudget ?? ''}
              onChange={(e) => updateFilter('maxBudget', e.target.value)}
              placeholder="Ex: 750"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy-800"
            />
          </div>

          
          <div>
            <label
              htmlFor="filter-sort"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Trier par
            </label>
            <select
              id="filter-sort"
              value={filters.sortBy || 'relevance'}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-navy-800"
            >
              <option value="relevance">Pertinence</option>
              <option value="price_asc">Prix croissant (CC)</option>
              <option value="price_desc">Prix décroissant (CC)</option>
              <option value="date_desc">Plus récents</option>
            </select>
          </div>
        </div>

        
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(filters.eligibleApl)}
                onChange={(e) => updateFilter('apl', e.target.checked)}
                className="rounded border-slate-300 text-sage-600 focus:ring-sage-500"
              />
              <span>Éligible APL (CAF)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(filters.acceptsVisale)}
                onChange={(e) => updateFilter('visale', e.target.checked)}
                className="rounded border-slate-300 text-sage-600 focus:ring-sage-500"
              />
              <span>Garantie Visale acceptée</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.furnished === 'true'}
                onChange={(e) => updateFilter('furnished', e.target.checked ? 'true' : 'all')}
                className="rounded border-slate-300 text-sage-600 focus:ring-sage-500"
              />
              <span>Meublé uniquement</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-sage-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showAdvancedFilters
                ? 'Masquer les filtres avancés'
                : 'Plus de filtres (code postal, surface, équipements...)'}
            </span>
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={filters.postalCode || ''}
                  onChange={(e) => updateFilter('postalCode', e.target.value)}
                  placeholder="Ex: 75005, 69007..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Budget min. (€/mois)
                </label>
                <input
                  type="number"
                  value={filters.minBudget ?? ''}
                  onChange={(e) => updateFilter('minBudget', e.target.value)}
                  placeholder="Ex: 400"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Surface min. (m²)
                </label>
                <input
                  type="number"
                  value={filters.minSurface ?? ''}
                  onChange={(e) => updateFilter('minSurface', e.target.value)}
                  placeholder="Ex: 18"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Surface max. (m²)
                </label>
                <input
                  type="number"
                  value={filters.maxSurface ?? ''}
                  onChange={(e) => updateFilter('maxSurface', e.target.value)}
                  placeholder="Ex: 50"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Disponible au plus tard le
                </label>
                <input
                  type="date"
                  value={filters.availableFrom || ''}
                  onChange={(e) => updateFilter('availableFrom', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-2">
                Équipements requis :
              </span>
              <div className="flex flex-wrap gap-2">
                {amenities.map((am) => {
                  const selected = (filters.amenities || []).includes(am.slug);
                  return (
                    <button
                      key={am.id}
                      type="button"
                      onClick={() => toggleAmenity(am.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {am.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      
      {items.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          
          {totalPages > 1 && (
            <nav
              aria-label="Pagination des résultats"
              className="flex items-center justify-center gap-2 pt-4"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilter('page', String(page - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-navy-950 disabled:opacity-40"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateFilter('page', String(p))}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                    p === page
                      ? 'bg-navy-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', String(page + 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-navy-950 disabled:opacity-40"
              >
                Suivant
              </button>
            </nav>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950">
            Aucun logement ne correspond exactement à ces critères
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Essayez d’élargir votre budget maximum ou de réinitialiser certains filtres d’équipements
            pour voir davantage d’offres vérifiées.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold"
          >
            Réinitialiser tous les filtres
          </button>
        </div>
      )}
    </div>
  );
};
