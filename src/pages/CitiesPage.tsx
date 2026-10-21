import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react';
import {
  getPublicReferenceData,
  searchPublishedProperties,
} from '../services/erikalogService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export const CitiesPage: React.FC = () => {
  const { cities } = getPublicReferenceData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SeoHead
        title="Villes Étudiantes en France : Studios, Résidences & Colocations | ErikaLog"
        description="Découvrez les grandes villes étudiantes françaises (Paris, Lyon, Toulouse, Bordeaux, Lille, Rennes, Montpellier, Strasbourg) : loyers moyens, campus et logements disponibles."
        canonicalPath="/villes"
      />

      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-sage-700">
          Métropoles universitaires
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950">
          Villes étudiantes en France
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Chaque ville étudiante possède ses propres quartiers universitaires, réseaux de transports
          et niveaux de loyers. Sélectionnez votre ville d’études pour consulter les campus, les
          secteurs recommandés et les logements disponibles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cities.map((city) => {
          const { total } = searchPublishedProperties({ city: city.name });
          return (
            <div
              key={city.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row"
            >
              <div className="sm:w-2/5 h-52 sm:h-auto relative">
                <img
                  src={
                    city.hero_image_url ||
                    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={city.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-navy-950/90 text-white text-xs font-semibold">
                  {city.department}
                </span>
              </div>
              <div className="sm:w-3/5 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-navy-950">{city.name}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sage-50 text-sage-800 border border-sage-200">
                      Loyer moyen ~{city.avg_student_rent} €
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {city.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {city.universities.slice(0, 3).map((u) => (
                      <span
                        key={u}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {total} logement{total > 1 ? 's' : ''} actif{total > 1 ? 's' : ''}
                  </span>
                  <Link
                    to={`/villes/${city.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-sage-700"
                  >
                    <span>Explorer {city.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CityDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { cities } = getPublicReferenceData();
  const city = cities.find((c) => c.slug === slug);

  if (!city) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-navy-950">Ville étudiante introuvable</h1>
        <p className="text-sm text-slate-600">
          La ville demandée n’est pas encore référencée ou l’URL est incorrecte.
        </p>
        <Link
          to="/villes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux villes étudiantes</span>
        </Link>
      </div>
    );
  }

  const { items: cityProperties } = searchPublishedProperties({
    city: city.name,
    pageSize: 12,
  });

  return (
    <div className="space-y-12 pb-10">
      <SeoHead
        title={city.seo_title || `Logement Étudiant à ${city.name} | ErikaLog`}
        description={city.seo_description || city.description}
        canonicalPath={`/villes/${city.slug}`}
      />

      
      <section className="relative bg-navy-950 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: `url("${city.hero_image_url || ''}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-950/75" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <Link
            to="/villes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Toutes les villes étudiantes</span>
          </Link>

          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-sage-700 text-xs font-semibold">
                {city.department} • {city.region}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-navy-800 text-xs font-medium text-slate-200">
                Codes postaux : {city.postal_codes.slice(0, 5).join(', ')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold">
              Logement étudiant à {city.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {city.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users className="w-4 h-4 text-sage-400" />
                <span>Population étudiante</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {city.student_population.toLocaleString('fr-FR')} étudiants
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="w-4 h-4 text-sage-400" />
                <span>Budget mensuel moyen (studio)</span>
              </div>
              <p className="text-xl font-bold text-sage-300 mt-1">
                ~{city.avg_student_rent} € / mois CC
              </p>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <GraduationCap className="w-4 h-4 text-sage-400" />
                <span>Pôles & Grandes écoles</span>
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {city.universities.length} campus majeurs
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sage-600" />
            <span>Universités & Grandes Écoles à {city.name}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {city.universities.map((u) => (
              <Link
                key={u}
                to={`/recherche?city=${encodeURIComponent(city.name)}&q=${encodeURIComponent(u)}`}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sage-50 border border-slate-200 text-xs font-medium text-navy-900"
              >
                {u}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sage-600" />
            <span>Quartiers étudiants recommandés</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {city.neighborhoods.map((nb) => (
              <Link
                key={nb}
                to={`/recherche?city=${encodeURIComponent(city.name)}`}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sage-50 border border-slate-200 text-xs font-medium text-navy-900"
              >
                {nb}
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-navy-950">
            Logements disponibles à {city.name} ({cityProperties.length})
          </h2>
          <Link
            to={`/recherche?city=${encodeURIComponent(city.name)}`}
            className="text-xs sm:text-sm font-semibold text-sage-700 hover:underline"
          >
            Filtrer dans le moteur de recherche →
          </Link>
        </div>

        {cityProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-600">
              Aucune annonce active dans cette ville pour le moment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
