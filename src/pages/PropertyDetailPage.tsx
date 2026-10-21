import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Flag,
  GraduationCap,
  Heart,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createSafetyReport,
  createViewingRequest,
  getPropertyBySlug,
  getPublicReferenceData,
  getSimilarProperties,
  startOrGetConversation,
} from '../services/erikalogService';
import { PROPERTY_TYPE_LABELS, PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export const PropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, favoriteIds, toggleFavorite, refreshState, showToast, siteSettings } = useApp();

  const property = slug ? getPropertyBySlug(slug, user) : null;
  const { amenities: allAmenities } = getPublicReferenceData();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  
  const [messageText, setMessageText] = useState(
    'Bonjour, je suis étudiant(e) et votre logement m’intéresse vivement. Mon dossier locatif est complet (avec garantie). Est-il toujours disponible ?'
  );
  const [sendingMsg, setSendingMsg] = useState(false);

  
  const [applicantName, setApplicantName] = useState(user?.full_name || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || '');
  const [preferredDate, setPreferredDate] = useState('2026-10-28');
  const [preferredSlot, setPreferredSlot] = useState('Après-midi (14h00 - 17h00)');
  const [visitMode, setVisitMode] = useState<'in_person' | 'video'>('in_person');
  const [visitMessage, setVisitMessage] = useState(
    'Bonjour, je souhaiterais visiter ce logement. J’ai préparé l’ensemble de mes justificatifs étudiants et de garantie.'
  );
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [submittingVisit, setSubmittingVisit] = useState(false);

  
  const [reportCategory, setReportCategory] = useState('inaccurate_info');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    if (user) {
      setApplicantName(user.full_name);
      setApplicantEmail(user.email);
      setApplicantPhone(user.phone || '+33 6 00 00 00 00');
    }
  }, [user]);

  
  useEffect(() => {
    const action = searchParams.get('action');
    if (user && action === 'message') {
      setShowMessageModal(true);
    } else if (user && action === 'visit') {
      setShowVisitModal(true);
    }
  }, [user, searchParams]);

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-navy-950">Logement indisponible ou introuvable</h1>
        <p className="text-sm text-slate-600">
          Cette annonce n’est plus publiée, est en cours de modération ou l’adresse URL est erronée.
        </p>
        <Link
          to="/recherche"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces disponibles</span>
        </Link>
      </div>
    );
  }

  const images = property.images || [];
  const activeImage =
    images[selectedImageIdx]?.url ||
    property.cover_image_url ||
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80';
  const isFav = favoriteIds.includes(property.id);
  const similarProperties = getSimilarProperties(property, 3);

  const handleOpenContact = (mode: 'message' | 'visit') => {
    if (!user) {
      const returnPath = `/logement/${property.slug}?action=${mode}`;
      showToast('Veuillez vous connecter ou créer un compte étudiant pour contacter l’annonceur.', 'info');
      navigate(`/connexion?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (mode === 'message') setShowMessageModal(true);
    else setShowVisitModal(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSendingMsg(true);
      const { conversation } = await startOrGetConversation(user, property.id, messageText);
      refreshState();
      setShowMessageModal(false);
      showToast('Votre message a été envoyé à l’annonceur !', 'success');
      navigate(`/messagerie?conversation=${conversation.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l’envoi', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSubmittingVisit(true);
      await createViewingRequest(user, {
        property_id: property.id,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone,
        preferred_date: preferredDate,
        preferred_time_slot: preferredSlot,
        visit_mode: visitMode,
        student_message: visitMessage,
        privacy_consent: privacyConsent,
      });
      refreshState();
      setShowVisitModal(false);
      showToast(
        'Votre demande de visite a bien été transmise à l’annonceur ! Vous serez notifié de sa réponse.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l’envoi', 'error');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/connexion?redirect=${encodeURIComponent(`/logement/${property.slug}`)}`);
      return;
    }
    if (reportDescription.trim().length < 15) {
      showToast('Veuillez détailler le motif de votre signalement (15 caractères min).', 'error');
      return;
    }
    try {
      await createSafetyReport(user, {
        target_type: 'property',
        target_property_id: property.id,
        reason_category: reportCategory,
        description: reportDescription,
      });
      setShowReportModal(false);
      setReportDescription('');
      showToast(
        'Signalement enregistré. Notre équipe de modération va examiner cette annonce.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors du signalement', 'error');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Lien du logement copié dans le presse-papiers !', 'success');
    } catch {
      showToast(window.location.href, 'info');
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: property.title,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city_name,
      postalCode: property.postal_code,
      addressCountry: 'FR',
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.surface_m2,
      unitCode: 'MTK',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SeoHead
        title={`${property.title} — ${property.rent_including_charges} €/mois CC | ErikaLog`}
        description={`${property.title} à ${property.city_name} (${property.postal_code}). Surface ${property.surface_m2} m², loyer ${property.rent_including_charges} € charges comprises.`}
        canonicalPath={`/logement/${property.slug}`}
        jsonLd={jsonLd}
      />

      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <Link to="/recherche" className="inline-flex items-center gap-1 hover:text-navy-900 font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Résultats</span>
          </Link>
          <span>/</span>
          <Link
            to={`/villes/${property.city_name.toLowerCase()}`}
            className="hover:text-navy-900 font-medium"
          >
            {property.city_name}
          </Link>
          <span>/</span>
          <span className="text-slate-400">Réf. {property.reference}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(property.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              isFav
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isFav ? 'Dans vos favoris' : 'Sauvegarder'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-xs font-medium text-slate-500"
            title="Signaler cette annonce à la modération"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Signaler</span>
          </button>
        </div>
      </div>

      
      {property.status !== 'published' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Aperçu privé — Statut actuel de l’annonce :{' '}
              <strong className="uppercase">{property.status}</strong>. Cette fiche n’est pas
              visible dans la recherche publique tant qu’elle n’est pas publiée.
            </span>
          </div>
        </div>
      )}

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 relative h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={activeImage}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-lg bg-navy-950/90 text-white text-xs font-semibold">
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </span>
            {property.is_demo && siteSettings.show_demo_badge && (
              <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
                Annonce de démonstration
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImageIdx(i)}
                className={`h-24 sm:h-32 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImageIdx === i
                    ? 'border-sage-600 ring-2 ring-sage-400/40'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt_text || property.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="bg-navy-950 text-white rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-sage-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Protection ErikaLog Étudiants</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ne versez jamais d’argent (caution, réservation, mandat) avant d’avoir visité le
              logement et signé le contrat de location officiel.
            </p>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sage-700">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.city_name} ({property.postal_code}) • {property.neighborhood}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                {property.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Localisation publique : <strong>{property.address_public}</strong>
              </p>
            </div>

            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Surface</span>
                <p className="text-base font-bold text-navy-950 flex items-center gap-1.5 mt-0.5">
                  <Maximize2 className="w-4 h-4 text-sage-600" />
                  {property.surface_m2} m²
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">
                  Configuration
                </span>
                <p className="text-base font-bold text-navy-950 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-4 h-4 text-sage-600" />
                  {property.rooms_count} pièce{property.rooms_count > 1 ? 's' : ''} •{' '}
                  {property.furnished ? 'Meublé' : 'Non meublé'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">
                  Disponibilité
                </span>
                <p className="text-base font-bold text-navy-950 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-sage-600" />
                  {new Date(property.available_from).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-semibold text-slate-500">
                  Énergie (DPE / GES)
                </span>
                <p className="text-base font-bold text-navy-950 mt-0.5">
                  DPE <span className="text-sage-700">{property.dpe_rating}</span> • GES{' '}
                  {property.ges_rating}
                </p>
              </div>
            </div>

            
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-lg font-bold text-navy-950">Description du logement</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            
            {property.nearby_schools.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-sage-600" />
                  <span>Établissements & Campus à proximité</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {property.nearby_schools.map((school) => (
                    <span
                      key={school}
                      className="px-3 py-1.5 rounded-xl bg-sage-50 border border-sage-200 text-xs font-semibold text-sage-900"
                    >
                      {school}
                    </span>
                  ))}
                </div>
              </div>
            )}

            
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-lg font-bold text-navy-950">Équipements & Services inclus</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(property.amenities || []).map((slugItem) => {
                  const found = allAmenities.find((a) => a.slug === slugItem);
                  return (
                    <div
                      key={slugItem}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-navy-950"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                      <span>{found ? found.label : slugItem}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-lg font-bold text-navy-950">
                Détail financier & Conditions de location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Loyer hors charges</span>
                  <span className="font-bold text-navy-950">
                    {property.rent_excluding_charges} € / mois
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Charges ({property.charges_type})</span>
                  <span className="font-bold text-navy-950">{property.charges_amount} € / mois</span>
                </div>
                <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 flex justify-between">
                  <span className="font-semibold text-sage-900">Loyer mensuel Charges Comprises</span>
                  <span className="font-extrabold text-sage-900">
                    {property.rent_including_charges} € / mois CC
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Dépôt de garantie</span>
                  <span className="font-bold text-navy-950">{property.security_deposit} €</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Honoraires de location TTC</span>
                  <span className="font-bold text-navy-950">
                    {property.agency_fees === 0
                      ? '0 € (Direct propriétaire)'
                      : `${property.agency_fees} €`}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-slate-600">Type de contrat</span>
                  <span className="font-bold text-navy-950">{property.lease_type}</span>
                </div>
              </div>

              {property.rental_conditions && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-navy-900">
                  <strong>Conditions précisées par l’annonceur :</strong>{' '}
                  {property.rental_conditions}
                </div>
              )}
            </div>
          </div>
        </div>

        
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-3xl font-extrabold text-navy-950">
                  {property.rent_including_charges} €
                </span>
                <span className="text-sm font-medium text-slate-500"> / mois CC</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {property.rent_excluding_charges} € HC + {property.charges_amount} € de charges
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {property.eligible_apl && (
                  <span className="px-2.5 py-0.5 rounded-md bg-sage-100 text-sage-800 text-xs font-bold">
                    Éligible APL
                  </span>
                )}
                {property.accepts_visale && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-navy-800 text-xs font-bold">
                    Visale accepté
                  </span>
                )}
              </div>
            </div>

            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOpenContact('visit')}
                className="w-full py-3.5 px-4 rounded-xl bg-sage-600 hover:bg-sage-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Demander une visite</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenContact('message')}
                className="w-full py-3.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Envoyer un message</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Une demande de visite est une proposition de créneau et ne constitue pas une
              réservation ferme tant que le bailleur ne l’a pas confirmée.
            </p>

            
            {property.owner && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-900 text-sage-300 font-bold flex items-center justify-center shrink-0">
                    {property.owner.full_name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-navy-950">
                        {property.owner.full_name}
                      </h3>
                      {property.owner.is_verified && (
                        <span title="Identité et statut vérifiés par ErikaLog">
                          <ShieldCheck className="w-4 h-4 text-sage-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {property.owner.account_type === 'real_estate_agent'
                        ? `Agence professionnelle (${property.owner.company_name || 'Carte CPI'})`
                        : 'Propriétaire bailleur particulier'}
                    </p>
                    {property.owner.professional_card && (
                      <p className="text-[11px] text-sage-700 font-medium">
                        Carte pro : {property.owner.professional_card}
                      </p>
                    )}
                  </div>
                </div>
                {property.owner.bio && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    {property.owner.bio}
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      
      {similarProperties.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-6">
          <h2 className="text-2xl font-bold text-navy-950">Logements similaires disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProperties.map((sim) => (
              <PropertyCard key={sim.id} property={sim} />
            ))}
          </div>
        </section>
      )}

      
      {showMessageModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sage-600" />
                <span>Envoyer un message à {property.owner?.full_name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
                Logement concerné : <strong>{property.title}</strong> ({property.rent_including_charges} €/mois CC)
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre message (présentez votre situation d’études et vos garanties)
                </label>
                <textarea
                  rows={5}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold"
                >
                  {sendingMsg ? 'Envoi en cours...' : 'Envoyer dans la messagerie privée'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showVisitModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sage-600" />
                <span>Demander une visite du logement</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVisit} className="space-y-4">
              <div className="p-3 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-900">
                <strong>{property.title}</strong> — {property.city_name} ({property.postal_code})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom complet du candidat
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone joignable
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Créneau horaire
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Matin (09h00 - 12h00)">Matin (09h00 - 12h00)</option>
                    <option value="Après-midi (14h00 - 17h00)">Après-midi (14h00 - 17h00)</option>
                    <option value="Fin de journée (17h00 - 19h30)">
                      Fin de journée (17h00 - 19h30)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Format de visite
                  </label>
                  <select
                    value={visitMode}
                    onChange={(e) => setVisitMode(e.target.value as 'in_person' | 'video')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="in_person">Sur place (Présentiel)</option>
                    <option value="video">En visio (Temps réel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message complémentaire (école, garants, durée souhaitée)
                </label>
                <textarea
                  rows={3}
                  value={visitMessage}
                  onChange={(e) => setVisitMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sage-600"
                />
                <span>
                  J’accepte que mes coordonnées de contact soient transmises à l’annonceur de ce
                  logement dans le seul but d’organiser cette visite, conformément à la Politique de
                  confidentialité RGPD d’ErikaLog.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold"
                >
                  {submittingVisit ? 'Transmission...' : 'Envoyer la demande de visite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-600" />
                <span>Signaler cette annonce à la modération</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif du signalement
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="fraud_scam">Suspicion de fraude ou fausse annonce</option>
                  <option value="illegal_fee_request">
                    Demande d’argent illégale avant visite
                  </option>
                  <option value="inaccurate_info">
                    Informations trompeuses (surface, DPE, honoraires)
                  </option>
                  <option value="already_rented">Logement déjà loué ou indisponible</option>
                  <option value="other">Autre motif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description précise (minimum 15 caractères)
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Expliquez les éléments constatés afin d’aider notre équipe de modération..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  Envoyer le signalement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
