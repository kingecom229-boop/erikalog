import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Euro,
  GraduationCap,
  HelpCircle,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPublicReferenceData, searchPublishedProperties } from '../services/erikalogService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export const HomePage: React.FC = () => {
  const { user, t } = useApp();
  const navigate = useNavigate();

  const [cityInput, setCityInput] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [maxBudget, setMaxBudget] = useState('');

  const refData = getPublicReferenceData();
  const featuredSearch = searchPublishedProperties({ sortBy: 'relevance', pageSize: 6 });
  const featuredProperties = featuredSearch.items;
  const featuredCities = refData.cities.filter((c) => c.is_featured).slice(0, 6);
  const topFaqs = refData.faqs.slice(0, 4);
  const topArticles = refData.articles.slice(0, 3);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cityInput.trim()) params.set('city', cityInput.trim());
    if (propertyType && propertyType !== 'all') params.set('type', propertyType);
    if (maxBudget.trim()) params.set('maxBudget', maxBudget.trim());
    navigate(`/recherche?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      <SeoHead
        title={t(
          'ErikaLog — Trouvez votre logement étudiant vérifié en France',
          'ErikaLog — Find Verified Student Housing in France'
        )}
        description={t(
          'Plateforme française de logement étudiant : studios, appartements, colocations et résidences étudiantes vérifiés par notre équipe.',
          'French student housing platform: verified studios, apartments, shared flats, and student residences.'
        )}
        canonicalPath="/"
      />

      <section className="relative bg-gradient-to-br from-navy-950 via-navy-800 to-navy-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-sage-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-sage-400" />
              <span>
                {t(
                  'Plateforme Française de Logement Étudiant • 100 % Annonces Vérifiées',
                  'French Student Housing Platform • 100% Verified Listings'
                )}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {t(
                'Trouvez votre logement étudiant vérifié partout en France',
                'Find your verified student home anywhere in France'
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {t(
                'Studios meublés, appartements T1/T2, colocations et résidences étudiantes publiés directement par des propriétaires bailleurs et agences vérifiés.',
                'Furnished studios, apartments, shared flats, and student residences published directly by verified private landlords and partner agencies.'
              )}
            </p>
          </div>

          <form
            onSubmit={handleQuickSearch}
            className="mt-8 bg-white dark:bg-[#0d1b31] rounded-2xl p-3 sm:p-4 shadow-card border border-slate-200/80 dark:border-navy-700 max-w-4xl text-slate-900 dark:text-white"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 px-3 pt-1">
                  {t('Ville, code postal ou université', 'City, postal code or university')}
                </label>
                <div className="flex items-center px-3 pb-1.5 pt-0.5">
                  <MapPin className="w-4 h-4 text-sage-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder={t(
                      'Paris, Lyon, Toulouse, Sorbonne, INSA...',
                      'Paris, Lyon, Toulouse, Sorbonne, INSA...'
                    )}
                    className="w-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 sm:border-l border-slate-200 dark:border-navy-800">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 px-3 pt-1">
                  {t('Type de bien', 'Property type')}
                </label>
                <div className="flex items-center px-3 pb-1.5 pt-0.5">
                  <Home className="w-4 h-4 text-sage-500 mr-2 shrink-0" />
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full text-sm font-medium text-slate-900 dark:text-white bg-transparent focus:outline-none"
                  >
                    <option value="all">{t('Tous les logements', 'All property types')}</option>
                    <option value="studio">Studio</option>
                    <option value="appartement">{t('Appartement T1/T2', 'Apartment T1/T2')}</option>
                    <option value="chambre">{t('Chambre étudiante', 'Student room')}</option>
                    <option value="colocation">{t('Colocation', 'Shared flat')}</option>
                    <option value="residence_etudiante">
                      {t('Résidence étudiante', 'Student residence')}
                    </option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 sm:border-l border-slate-200 dark:border-navy-800">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 px-3 pt-1">
                  {t('Budget max CC', 'Max budget')}
                </label>
                <div className="flex items-center px-3 pb-1.5 pt-0.5">
                  <Euro className="w-4 h-4 text-sage-500 mr-1.5 shrink-0" />
                  <input
                    type="number"
                    min="200"
                    max="2500"
                    step="50"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="700 €"
                    className="w-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-glow"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('Trouver', 'Search')}</span>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="font-semibold text-white">
              {t('Recherches fréquentes :', 'Popular searches:')}
            </span>
            {['Paris', 'Lyon', 'Toulouse', 'Bordeaux', 'Lille', 'Montpellier'].map((city) => (
              <Link
                key={city}
                to={`/recherche?city=${city.toLowerCase()}`}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-sage-500 border border-white/20 text-white transition-colors font-medium"
              >
                {city}
              </Link>
            ))}
            <Link
              to="/recherche?acceptsVisale=true"
              className="px-3 py-1 rounded-full bg-sage-500/30 hover:bg-sage-500 border border-sage-400/50 text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('Éligibles Garantie Visale', 'Visale Guarantee Accepted')}</span>
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <BadgeCheck className="w-8 h-8 text-sage-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">
                  {t('Propriétaires & Agences vérifiés', 'Verified Landlords & Agencies')}
                </p>
                <p className="text-xs text-slate-200">
                  {t('Chaque annonce est contrôlée avant mise en ligne', 'Every listing is reviewed before publication')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <GraduationCap className="w-8 h-8 text-sage-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">
                  {t('Compatible Visale & CAF / APL', 'Visale & APL Compatible')}
                </p>
                <p className="text-xs text-slate-200">
                  {t('Filtrez selon vos aides et votre garant étudiant', 'Filter by student housing aid and guarantor')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <Users className="w-8 h-8 text-sage-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">
                  {t('Contact direct & Visites rapides', 'Direct Contact & Fast Viewings')}
                </p>
                <p className="text-xs text-slate-200">
                  {t('Planifiez vos visites en présentiel ou en visio', 'Schedule in-person or video viewings online')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
              {t('Destinations Universitaires', 'University Destinations')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-1">
              {t('Explorez les grandes villes étudiantes', 'Explore major French student cities')}
            </h2>
          </div>
          <Link
            to="/villes"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-800 dark:text-sage-400 hover:text-sage-600 transition-colors"
          >
            <span>{t('Voir les 8 villes étudiantes', 'View all 8 student cities')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredCities.map((city) => (
            <Link
              key={city.id}
              to={`/villes/${city.slug}`}
              className="group relative h-60 rounded-2xl overflow-hidden shadow-soft border border-slate-200 dark:border-navy-800"
            >
              <img
                src={city.hero_image_url || undefined}
                alt={city.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/35 to-transparent" />
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-sage-500 text-white text-xs font-bold shadow-sm">
                {t('Loyer moy.', 'Avg. rent')} ~{city.avg_student_rent} €/mois
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold">{city.name}</h3>
                  <span className="text-xs font-semibold text-sage-300">
                    Dép. {city.department}
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-1">
                  {city.universities.slice(0, 2).join(' • ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
              {t('Logements Vérifiés', 'Verified Listings')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white">
              {t('Dernières offres de logements étudiants', 'Latest student housing listings')}
            </h2>
          </div>
          <Link
            to="/recherche"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <span>
              {t(
                `Parcourir les ${featuredSearch.total} logements`,
                `Browse all ${featuredSearch.total} listings`
              )}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-[#0d1b31] border-y border-slate-200/80 dark:border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
              {t('Simplicité & Sécurité', 'Simplicity & Trust')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white">
              {t('Comment fonctionne ErikaLog ?', 'How does ErikaLog work?')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t(
                'Un parcours clair inspiré des meilleures pratiques du logement étudiant en France, sans frais cachés.',
                'A transparent workflow built for student housing in France, with zero hidden fees.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-navy-800 text-white flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-sage-400" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
                    {t('Parcours Étudiant (100 % Gratuit)', 'Student Journey (100% Free)')}
                  </span>
                  <h3 className="text-xl font-bold text-navy-950 dark:text-white">
                    {t('Vous cherchez un logement étudiant', 'Looking for student housing')}
                  </h3>
                </div>
              </div>

              <ol className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-navy-950 dark:text-white">
                      {t('Recherchez selon votre campus et budget CC :', 'Search by campus and total budget:')}
                    </strong>{' '}
                    {t(
                      'filtrez par ville, école, éligibilité APL, garantie Visale et équipements.',
                      'filter by city, university, APL eligibility, Visale guarantee, and amenities.'
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-navy-950 dark:text-white">
                      {t('Échangez en direct avec le bailleur :', 'Chat directly with the landlord:')}
                    </strong>{' '}
                    {t(
                      'posez vos questions via la messagerie sécurisée sans exposer vos données.',
                      'ask questions via private messaging while keeping your personal data safe.'
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-navy-950 dark:text-white">
                      {t('Planifiez votre visite :', 'Book your viewing:')}
                    </strong>{' '}
                    {t(
                      'proposez un créneau en présentiel ou en visio et suivez la confirmation en temps réel.',
                      'propose an in-person or video slot and track confirmations in real time.'
                    )}
                  </div>
                </li>
              </ol>

              <div className="pt-2">
                <Link
                  to="/recherche"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold transition-colors"
                >
                  <span>{t('Trouver mon logement étudiant', 'Find my student home')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-navy-950 text-white p-6 sm:p-8 space-y-6 border border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sage-500 text-white flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sage-400">
                    {t('Espace Bailleur & Professionnel', 'Landlord & Agency Space')}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {t(
                      'Vous êtes propriétaire ou agence immobilière',
                      'You are a private landlord or agency'
                    )}
                  </h3>
                </div>
              </div>

              <ol className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white">
                      {t('Publiez vos biens en 9 étapes guidées :', 'Publish listings in 9 guided steps:')}
                    </strong>{' '}
                    {t(
                      'caractéristiques, loyer HC + charges, DPE/GES, conditions et galerie photos.',
                      'specs, rent + utilities, energy ratings, lease terms, and photo gallery.'
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white">
                      {t('Recevez des candidatures qualifiées :', 'Receive qualified applications:')}
                    </strong>{' '}
                    {t(
                      'étudiants avec école renseignée, budget vérifié et garantie Visale ou parentale.',
                      'students with verified university, budget, and Visale or parental guarantor.'
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sage-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white">
                      {t('Gérez vos visites et votre parc :', 'Manage viewings & portfolio:')}
                    </strong>{' '}
                    {t(
                      'acceptez, refusez ou proposez un autre créneau en un clic depuis votre espace.',
                      'accept, decline, or propose alternative viewing slots in one click.'
                    )}
                  </div>
                </li>
              </ol>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user?.role === 'student' ? (
                  <span className="text-xs text-slate-400 italic">
                    {t(
                      'Note : seuls les comptes Propriétaire ou Agence peuvent déposer une annonce.',
                      'Note: only Landlord or Agency accounts can publish property listings.'
                    )}
                  </span>
                ) : (
                  <Link
                    to={
                      user && (user.role === 'owner' || user.role === 'agent')
                        ? '/annonceur?tab=new'
                        : '/inscription?role=owner'
                    }
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold transition-colors"
                  >
                    <span>{t('Déposer une annonce gratuitement', 'Post a listing for free')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
              {t('Conseils & Vie Étudiante', 'Student Housing Guides')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-1">
              {t(
                'Guides pratiques pour réussir votre location',
                'Practical guides for your student rental'
              )}
            </h2>
          </div>
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-800 dark:text-sage-400 hover:text-sage-600"
          >
            <span>{t('Tous nos guides étudiants', 'All student guides')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topArticles.map((article) => (
            <Link
              key={article.id}
              to={`/guides/${article.slug}`}
              className="group bg-white dark:bg-[#0d1b31] rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden shadow-soft hover:shadow-card transition-all flex flex-col"
            >
              <div className="h-44 overflow-hidden bg-slate-100">
                <img
                  src={article.cover_image_url || undefined}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-700 font-semibold">
                      {article.category}
                    </span>
                    <span className="text-slate-400">{article.reading_time_min} min</span>
                  </div>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white group-hover:text-sage-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-navy-800 dark:text-sage-400 pt-1">
                  <BookOpen className="w-3.5 h-3.5 text-sage-500" />
                  <span>{t('Lire le guide complet', 'Read full guide')}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sage-600">
            {t('Questions Fréquentes', 'Frequently Asked Questions')}
          </span>
          <h2 className="text-2xl font-extrabold text-navy-950 dark:text-white">
            {t('Tout savoir avant de louer ou de publier', 'Everything you need to know')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-[#0d1b31] rounded-2xl border border-slate-200 dark:border-navy-800 p-5 space-y-2 shadow-soft"
            >
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-sage-500 shrink-0 mt-1" />
                <h3 className="text-sm font-bold text-navy-950 dark:text-white">{faq.question}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link
            to="/aide"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-[#0d1b31] text-xs font-bold text-navy-900 dark:text-white hover:bg-slate-50"
          >
            <CheckCircle2 className="w-4 h-4 text-sage-500" />
            <span>{t('Consulter toutes les réponses de la FAQ', 'View all FAQ answers')}</span>
          </Link>
        </div>
      </section>
    </div>
  );
};
