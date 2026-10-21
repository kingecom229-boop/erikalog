import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileEdit,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  changeOwnPassword,
  createOrUpdateProperty,
  getAdvertiserProperties,
  getPublicReferenceData,
  getUserConversations,
  getViewingRequestsForUser,
  updatePropertyStatusByOwner,
  updateUserProfile,
  updateViewingRequestStatus,
} from '../services/erikalogService';
import { validatePropertyImageFile } from '../lib/validation';
import { PROPERTY_TYPE_LABELS } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';
import type { Property, PropertyStatus, PropertyTypeSlug } from '../types/database';

type AdvertiserTab =
  | 'overview'
  | 'listings'
  | 'create'
  | 'visits'
  | 'profile'
  | 'settings';

export const AdvertiserDashboardPage: React.FC = () => {
  const { user, setUser, refreshState, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdvertiserTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdvertiserTab>(initialTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { cities, amenities: allAmenities } = getPublicReferenceData();

  
  const [step, setStep] = useState<number>(1);
  const [editingPropertyId, setEditingPropertyId] = useState<string | undefined>(undefined);
  const [propType, setPropType] = useState<PropertyTypeSlug>('studio');
  const [cityName, setCityName] = useState('Paris');
  const [postalCode, setPostalCode] = useState('75005');
  const [neighborhood, setNeighborhood] = useState('Quartier Latin (5e)');
  const [addressPublic, setAddressPublic] = useState('Rue Saint-Jacques — Métro Luxembourg');
  const [nearbySchoolsInput, setNearbySchoolsInput] = useState(
    'Sorbonne Université, Sciences Po Paris'
  );
  const [surfaceM2, setSurfaceM2] = useState<number>(20);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [bedroomsCount, setBedroomsCount] = useState<number>(1);
  const [floorNumber, setFloorNumber] = useState<number>(2);
  const [hasElevator, setHasElevator] = useState<boolean>(true);
  const [furnished, setFurnished] = useState<boolean>(true);
  const [dpeRating, setDpeRating] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS'>('C');
  const [gesRating, setGesRating] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS'>('B');
  const [rentHC, setRentHC] = useState<number>(690);
  const [chargesAmount, setChargesAmount] = useState<number>(60);
  const [chargesType, setChargesType] = useState<'forfait' | 'provision' | 'incluses'>('forfait');
  const [securityDeposit, setSecurityDeposit] = useState<number>(690);
  const [agencyFees, setAgencyFees] = useState<number>(0);
  const [availableFrom, setAvailableFrom] = useState<string>('2026-09-01');
  const [minLeaseMonths, setMinLeaseMonths] = useState<number>(9);
  const [leaseType, setLeaseType] = useState<string>('Bail étudiant 9 mois ou meublé 12 mois');
  const [eligibleApl, setEligibleApl] = useState<boolean>(true);
  const [acceptsVisale, setAcceptsVisale] = useState<boolean>(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'fibre_wifi',
    'bureau_etude',
    'cuisine_equipee',
    'proche_transports',
  ]);
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rentalConditions, setRentalConditions] = useState(
    'Dossier étudiant complet + Garantie Visale ou garant physique résidant en France/UE.'
  );

  
  const [proposingForId, setProposingForId] = useState<string | null>(null);
  const [altDate, setAltDate] = useState('2026-10-29');
  const [altSlot, setAltSlot] = useState('Après-midi (14h00 - 17h00)');
  const [altMessage, setAltMessage] = useState('');

  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [siret, setSiret] = useState(user?.siret || '');
  const [professionalCard, setProfessionalCard] = useState(user?.professional_card || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!user) {
    return <Navigate to="/connexion?redirect=/annonceur" replace />;
  }

  
  if (user.role === 'student') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-navy-950">
          Accès réservé aux Propriétaires & Professionnels
        </h1>
        <p className="text-sm text-slate-600">
          Conformément aux règles d’ErikaLog, les comptes étudiants ne peuvent pas publier ou
          administrer d’annonces immobilières.
        </p>
        <Link
          to="/etudiant"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
        >
          Aller vers mon Espace Étudiant
        </Link>
      </div>
    );
  }

  const myListings = getAdvertiserProperties(user.id);
  const viewingRequests = getViewingRequestsForUser(user);
  const conversations = getUserConversations(user);

  const filteredListings = myListings.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'rented_archived') {
      return ['rented', 'unavailable', 'archived'].includes(item.status);
    }
    return item.status === statusFilter;
  });

  const switchTab = (tab: AdvertiserTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const startEditProperty = (prop: Property) => {
    setEditingPropertyId(prop.id);
    setPropType(prop.property_type);
    setCityName(prop.city_name);
    setPostalCode(prop.postal_code);
    setNeighborhood(prop.neighborhood || '');
    setAddressPublic(prop.address_public);
    setNearbySchoolsInput(prop.nearby_schools.join(', '));
    setSurfaceM2(prop.surface_m2);
    setRoomsCount(prop.rooms_count);
    setBedroomsCount(prop.bedrooms_count);
    setFloorNumber(prop.floor_number || 1);
    setHasElevator(prop.has_elevator);
    setFurnished(prop.furnished);
    setDpeRating(prop.dpe_rating);
    setGesRating(prop.ges_rating);
    setRentHC(prop.rent_excluding_charges);
    setChargesAmount(prop.charges_amount);
    setChargesType(prop.charges_type);
    setSecurityDeposit(prop.security_deposit);
    setAgencyFees(prop.agency_fees);
    setAvailableFrom(prop.available_from);
    setMinLeaseMonths(prop.min_lease_months);
    setLeaseType(prop.lease_type);
    setEligibleApl(prop.eligible_apl);
    setAcceptsVisale(prop.accepts_visale);
    setSelectedAmenities(prop.amenities || ['fibre_wifi']);
    setImageUrls(
      prop.images?.map((i) => i.url) || [
        prop.cover_image_url ||
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      ]
    );
    setTitle(prop.title);
    setDescription(prop.description);
    setRentalConditions(prop.rental_conditions || '');
    setStep(1);
    switchTab('create');
  };

  const resetForm = () => {
    setEditingPropertyId(undefined);
    setTitle('');
    setDescription('');
    setStep(1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validatePropertyImageFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Fichier invalide', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrls((prev) => [...prev, reader.result as string]);
        showToast('Photo vérifiée et ajoutée à la galerie.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const next = [...imageUrls];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setImageUrls(next);
  };

  const handleSaveListing = async (targetStatus: 'draft' | 'pending') => {
    if (surfaceM2 < 9) {
      showToast('En France, la surface habitable d’un logement étudiant doit être ≥ 9 m².', 'error');
      return;
    }
    if (!title.trim() || title.trim().length < 10) {
      showToast('Veuillez saisir un titre descriptif d’au moins 10 caractères (Étape 8).', 'error');
      setStep(8);
      return;
    }
    if (!description.trim() || description.trim().length < 30) {
      showToast('Veuillez rédiger une description détaillée du bien (Étape 8).', 'error');
      setStep(8);
      return;
    }
    if (imageUrls.length === 0) {
      showToast('Ajoutez au moins une photo du logement (Étape 7).', 'error');
      setStep(7);
      return;
    }

    try {
      const saved = await createOrUpdateProperty(
        user,
        {
          id: editingPropertyId,
          title,
          property_type: propType,
          city_name: cityName,
          postal_code: postalCode,
          neighborhood,
          address_public: addressPublic,
          nearby_schools: nearbySchoolsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          surface_m2: Number(surfaceM2),
          rooms_count: Number(roomsCount),
          bedrooms_count: Number(bedroomsCount),
          bathrooms_count: 1,
          floor_number: Number(floorNumber),
          has_elevator: hasElevator,
          furnished,
          dpe_rating: dpeRating,
          ges_rating: gesRating,
          rent_excluding_charges: Number(rentHC),
          charges_amount: Number(chargesAmount),
          charges_type: chargesType,
          security_deposit: Number(securityDeposit),
          agency_fees: Number(agencyFees),
          available_from: availableFrom,
          min_lease_months: Number(minLeaseMonths),
          lease_type: leaseType,
          eligible_apl: eligibleApl,
          accepts_visale: acceptsVisale,
          guarantor_required: true,
          description,
          rental_conditions: rentalConditions,
          amenities: selectedAmenities,
          imageUrls,
        },
        targetStatus
      );
      refreshState();
      resetForm();
      switchTab('listings');
      showToast(
        saved.status === 'pending'
          ? 'Annonce soumise à la modération ErikaLog ! Elle sera publiée dès validation.'
          : 'Brouillon enregistré dans votre espace annonceur.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleStatusAction = async (propertyId: string, nextStatus: PropertyStatus) => {
    try {
      await updatePropertyStatusByOwner(user, propertyId, nextStatus);
      refreshState();
      showToast(`Statut de l’annonce mis à jour : ${nextStatus}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action impossible', 'error');
    }
  };

  const stepLabels = [
    '1. Type',
    '2. Localisation',
    '3. Caractéristiques',
    '4. Prix & Charges',
    '5. Disponibilité',
    '6. Équipements',
    '7. Photos',
    '8. Description',
    '9. Aperçu & Envoi',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Tableau de bord Propriétaire & Agence | ErikaLog"
        description="Publiez et gérez vos offres de logements étudiants, répondez aux demandes de visite et échangez avec les candidats."
        canonicalPath="/annonceur"
      />

      
      <div className="bg-navy-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sage-600 text-xs font-bold uppercase">
              {user.role === 'agent' ? 'Compte Agence / Professionnel' : 'Compte Propriétaire'}
            </span>
            {user.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-sage-300 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Annonceur vérifié
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{user.full_name}</h1>
          <p className="text-xs text-slate-300">
            {user.company_name || 'Gestion locative directe'}
            {user.professional_card ? ` • ${user.professional_card}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              switchTab('create');
            }}
            className="px-4 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-500 text-xs font-bold text-white inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer une annonce</span>
          </button>
          <Link
            to="/messagerie"
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-bold text-white inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-sage-400" />
            <span>Messagerie ({conversations.length})</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3 space-y-1">
          {[
            { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
            { id: 'listings', label: 'Mes annonces', icon: Building2, badge: myListings.length },
            { id: 'create', label: 'Publier un logement', icon: PlusCircle },
            {
              id: 'visits',
              label: 'Demandes de visite',
              icon: Calendar,
              badge: viewingRequests.filter((v) => v.status === 'pending').length,
            },
            { id: 'profile', label: 'Profil annonceur', icon: User },
            { id: 'settings', label: 'Mot de passe & Sécurité', icon: KeyRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchTab(item.id as AdvertiserTab)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors ${
                  active ? 'bg-navy-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-sage-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      active ? 'bg-sage-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        
        <div className="lg:col-span-9 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Annonces publiées</span>
                  <p className="text-2xl font-extrabold text-sage-700 mt-1">
                    {myListings.filter((l) => l.status === 'published').length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">En modération</span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">
                    {myListings.filter((l) => l.status === 'pending').length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Demandes de visite</span>
                  <p className="text-2xl font-extrabold text-navy-950 mt-1">
                    {viewingRequests.length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Conversations</span>
                  <p className="text-2xl font-extrabold text-navy-950 mt-1">
                    {conversations.length}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-navy-950">
                    Dernières demandes de visite reçues
                  </h2>
                  <button
                    type="button"
                    onClick={() => switchTab('visits')}
                    className="text-xs font-semibold text-sage-700 hover:underline"
                  >
                    Gérer les visites →
                  </button>
                </div>
                {viewingRequests.slice(0, 3).map((vr) => (
                  <div
                    key={vr.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-navy-950">
                        {vr.applicant_name} ({vr.applicant_phone})
                      </p>
                      <p className="text-xs text-slate-600">
                        Logement : <strong>{vr.property?.title}</strong> • Souhaite visiter le{' '}
                        {new Date(vr.preferred_date).toLocaleDateString('fr-FR')} (
                        {vr.preferred_time_slot})
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-navy-100 text-navy-900 text-xs font-bold uppercase self-start">
                      {vr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-navy-950">
                  Gestion de mes annonces ({myListings.length})
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Toutes' },
                    { id: 'published', label: 'Publiées' },
                    { id: 'pending', label: 'En attente' },
                    { id: 'draft', label: 'Brouillons' },
                    { id: 'rejected', label: 'Rejetées' },
                    { id: 'rented_archived', label: 'Louées / Archivées' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        statusFilter === f.id
                          ? 'bg-navy-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredListings.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={
                          prop.cover_image_url ||
                          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={prop.title}
                        className="w-24 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            {prop.reference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              prop.status === 'published'
                                ? 'bg-sage-100 text-sage-800'
                                : prop.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : prop.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {prop.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-navy-950">{prop.title}</h3>
                        <p className="text-xs text-slate-600">
                          {prop.city_name} ({prop.postal_code}) • {prop.surface_m2} m² •{' '}
                          <strong>{prop.rent_including_charges} €/mois CC</strong>
                        </p>
                        {prop.rejection_reason && (
                          <p className="text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 mt-1">
                            Motif modération : {prop.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/logement/${prop.slug}`}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-navy-950"
                        title="Prévisualiser la fiche"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEditProperty(prop)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-navy-900 hover:bg-slate-50 inline-flex items-center gap-1"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      {(prop.status === 'draft' || prop.status === 'rejected') && (
                        <button
                          type="button"
                          onClick={() => handleStatusAction(prop.id, 'pending')}
                          className="px-3 py-1.5 rounded-lg bg-sage-600 text-white text-xs font-semibold"
                        >
                          Soumettre
                        </button>
                      )}
                      {prop.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => handleStatusAction(prop.id, 'rented')}
                          className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold"
                        >
                          Marquer loué
                        </button>
                      )}
                      {prop.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleStatusAction(prop.id, 'archived')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                        >
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {activeTab === 'create' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sage-700">
                    Formulaire guidé en 9 étapes
                  </span>
                  <h2 className="text-xl font-bold text-navy-950">
                    {editingPropertyId
                      ? 'Modifier mon annonce immobilière'
                      : 'Publier un nouveau logement étudiant'}
                  </h2>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-navy-900 text-white">
                  Étape {step} / 9
                </span>
              </div>

              
              <div className="flex flex-wrap gap-1.5">
                {stepLabels.map((label, idx) => {
                  const s = idx + 1;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setStep(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                        step === s
                          ? 'bg-navy-900 text-white'
                          : step > s
                          ? 'bg-sage-100 text-sage-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 1 — Choisissez le type de logement étudiant
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        'studio',
                        'appartement',
                        'residence_etudiante',
                        'colocation',
                        'chambre',
                      ] as PropertyTypeSlug[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPropType(t)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          propType === t
                            ? 'bg-navy-900 text-white border-navy-900 shadow-md'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-sm font-bold">{PROPERTY_TYPE_LABELS[t]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 2 — Localisation et campus à proximité
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ville
                      </label>
                      <select
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        {cities.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Code postal (5 chiffres)
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quartier / Secteur
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse ou localisation publique (rue & métro/tramway)
                    </label>
                    <input
                      type="text"
                      value={addressPublic}
                      onChange={(e) => setAddressPublic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Établissements d’enseignement proches (séparés par une virgule)
                    </label>
                    <input
                      type="text"
                      value={nearbySchoolsInput}
                      onChange={(e) => setNearbySchoolsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 3 — Caractéristiques & Diagnostics énergétiques
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Surface habitable (m²)
                      </label>
                      <input
                        type="number"
                        min={9}
                        value={surfaceM2}
                        onChange={(e) => setSurfaceM2(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre de pièces
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={roomsCount}
                        onChange={(e) => setRoomsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chambres
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bedroomsCount}
                        onChange={(e) => setBedroomsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Étage
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Classe DPE
                      </label>
                      <select
                        value={dpeRating}
                        onChange={(e) =>
                          setDpeRating(
                            e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS'
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => (
                          <option key={r} value={r}>
                            Classe {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Classe GES
                      </label>
                      <select
                        value={gesRating}
                        onChange={(e) =>
                          setGesRating(
                            e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS'
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => (
                          <option key={r} value={r}>
                            Classe {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5">
                      <input
                        type="checkbox"
                        checked={furnished}
                        onChange={(e) => setFurnished(e.target.checked)}
                      />
                      <span>Logement meublé</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5">
                      <input
                        type="checkbox"
                        checked={hasElevator}
                        onChange={(e) => setHasElevator(e.target.checked)}
                      />
                      <span>Ascenseur</span>
                    </label>
                  </div>
                </div>
              )}

              
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 4 — Loyer mensuel, charges et dépôt de garantie
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Loyer hors charges (€/mois)
                      </label>
                      <input
                        type="number"
                        min={150}
                        value={rentHC}
                        onChange={(e) => setRentHC(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Montant des charges (€/mois)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={chargesAmount}
                        onChange={(e) => setChargesAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Type de charges
                      </label>
                      <select
                        value={chargesType}
                        onChange={(e) =>
                          setChargesType(e.target.value as 'forfait' | 'provision' | 'incluses')
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="forfait">Forfait de charges</option>
                        <option value="provision">Provision sur charges</option>
                        <option value="incluses">Charges incluses</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 text-sm font-bold text-sage-900">
                    Loyer mensuel Charges Comprises calculé : {Number(rentHC) + Number(chargesAmount)}{' '}
                    € / mois CC
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dépôt de garantie (€)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Honoraires agence TTC (€ — 0 si particulier)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={agencyFees}
                        onChange={(e) => setAgencyFees(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 5 — Disponibilité & Conditions de location
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Disponible à partir du
                      </label>
                      <input
                        type="date"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Durée minimale (mois)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={minLeaseMonths}
                        onChange={(e) => setMinLeaseMonths(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Type de bail
                      </label>
                      <input
                        type="text"
                        value={leaseType}
                        onChange={(e) => setLeaseType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={eligibleApl}
                        onChange={(e) => setEligibleApl(e.target.checked)}
                      />
                      <span>Logement conventionné / Éligible aux APL (CAF)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={acceptsVisale}
                        onChange={(e) => setAcceptsVisale(e.target.checked)}
                      />
                      <span>Garantie Visale (Action Logement) acceptée</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Précisions sur les conditions de location
                    </label>
                    <textarea
                      rows={3}
                      value={rentalConditions}
                      onChange={(e) => setRentalConditions(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 6 — Sélectionnez les équipements inclus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {allAmenities.map((am) => {
                      const checked = selectedAmenities.includes(am.slug);
                      return (
                        <button
                          key={am.id}
                          type="button"
                          onClick={() =>
                            setSelectedAmenities((prev) =>
                              checked ? prev.filter((s) => s !== am.slug) : [...prev, am.slug]
                            )
                          }
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                            checked
                              ? 'bg-navy-900 text-white border-navy-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{am.label}</span>
                          {checked && <CheckCircle2 className="w-4 h-4 text-sage-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              
              {step === 7 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 7 — Photos du logement (Réordonnancement & Photo principale)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formats acceptés : JPG, PNG, WebP (max 5 Mo par photo). La première photo est
                    utilisée comme photo principale.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newImageUrl.trim()) return;
                          setImageUrls((prev) => [...prev, newImageUrl.trim()]);
                          setNewImageUrl('');
                        }}
                        className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
                      >
                        Ajouter URL
                      </button>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold cursor-pointer inline-flex items-center">
                      <span>Téléverser un fichier image</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-16 h-14 rounded-lg object-cover"
                          />
                          <div>
                            <span className="text-xs font-bold text-navy-950">
                              Photo #{idx + 1} {idx === 0 ? '(Principale)' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'up')}
                            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'down')}
                            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 rounded bg-white border border-red-200 text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
              {step === 8 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 8 — Titre et description détaillée de l’annonce
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Titre de l’annonce (ex: Studio meublé 21 m² — Lyon 7 Jean Macé)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Studio meublé lumineux 20 m² proche campus..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description complète (agencement, mobilier, calme, transports)
                    </label>
                    <textarea
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez précisément le logement, les équipements de la cuisine, le mobilier d’étude et la proximité des transports..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              
              {step === 9 && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-navy-950">
                    Étape 9 — Aperçu récapitulatif & Soumission à la modération
                  </h3>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-navy-950">
                        {title || 'Titre à compléter (Étape 8)'}
                      </span>
                      <span className="font-extrabold text-sage-800 text-base">
                        {Number(rentHC) + Number(chargesAmount)} € / mois CC
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {PROPERTY_TYPE_LABELS[propType]} • {surfaceM2} m² • {cityName} ({postalCode}) •{' '}
                      {neighborhood}
                    </p>
                    <p className="text-slate-700 line-clamp-3">
                      {description || 'Description à compléter (Étape 8)'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveListing('draft')}
                      className="px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy-950 text-xs font-bold"
                    >
                      Enregistrer en brouillon
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveListing('pending')}
                      className="px-6 py-3 rounded-xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold shadow"
                    >
                      Soumettre l’annonce à la modération
                    </button>
                  </div>
                </div>
              )}

              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={step <= 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  ← Étape précédente
                </button>
                {step < 9 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(9, s + 1))}
                    className="px-5 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
                  >
                    Étape suivante →
                  </button>
                )}
              </div>
            </div>
          )}

          
          {activeTab === 'visits' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Demandes de visite reçues ({viewingRequests.length})
              </h2>
              {viewingRequests.map((vr) => (
                <div
                  key={vr.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-navy-950">
                        Candidat : {vr.applicant_name} ({vr.applicant_email} • {vr.applicant_phone})
                      </h3>
                      <p className="text-xs text-sage-700 font-semibold">
                        Logement : {vr.property?.title}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-navy-100 text-navy-900 text-xs font-bold uppercase">
                      {vr.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    Créneau souhaité :{' '}
                    <strong>
                      {new Date(vr.preferred_date).toLocaleDateString('fr-FR')} —{' '}
                      {vr.preferred_time_slot}
                    </strong>{' '}
                    ({vr.visit_mode === 'video' ? 'En visio' : 'Présentiel'})
                  </p>
                  {vr.student_message && (
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      « {vr.student_message} »
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateViewingRequestStatus(user, vr.id, 'accepted', {
                          advertiser_response:
                            'Votre créneau de visite est confirmé ! Merci d’apporter votre pièce d’identité et votre dossier.',
                        });
                        refreshState();
                        showToast('Visite confirmée et étudiant notifié !', 'success');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold"
                    >
                      Accepter le créneau
                    </button>

                    <button
                      type="button"
                      onClick={() => setProposingForId(proposingForId === vr.id ? null : vr.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold"
                    >
                      Proposer un autre créneau
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await updateViewingRequestStatus(user, vr.id, 'declined', {
                          advertiser_response:
                            'Nous ne sommes malheureusement pas disponibles sur ce créneau.',
                        });
                        refreshState();
                        showToast('Demande de visite déclinée.', 'info');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold"
                    >
                      Refuser
                    </button>
                  </div>

                  {proposingForId === vr.id && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={altDate}
                          onChange={(e) => setAltDate(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                        />
                        <select
                          value={altSlot}
                          onChange={(e) => setAltSlot(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="Matin (09h00 - 12h00)">Matin (09h00 - 12h00)</option>
                          <option value="Après-midi (14h00 - 17h00)">
                            Après-midi (14h00 - 17h00)
                          </option>
                          <option value="Fin de journée (17h00 - 19h30)">
                            Fin de journée (17h00 - 19h30)
                          </option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={altMessage}
                        onChange={(e) => setAltMessage(e.target.value)}
                        placeholder="Message accompagnant votre proposition..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await updateViewingRequestStatus(
                            user,
                            vr.id,
                            'alternative_proposed',
                            {
                              proposed_date: altDate,
                              proposed_time_slot: altSlot,
                              advertiser_response:
                                altMessage || `Proposition de visite le ${altDate} (${altSlot}).`,
                            }
                          );
                          setProposingForId(null);
                          refreshState();
                          showToast('Nouveau créneau proposé à l’étudiant.', 'success');
                        }}
                        className="px-4 py-2 rounded-lg bg-sage-600 text-white text-xs font-bold"
                      >
                        Envoyer la proposition
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          
          {activeTab === 'profile' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const updated = await updateUserProfile(user.id, {
                  full_name: fullName,
                  phone,
                  company_name: companyName,
                  siret,
                  professional_card: professionalCard,
                  bio,
                });
                setUser(updated);
                refreshState();
                showToast('Profil annonceur enregistré.', 'success');
              }}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-navy-950">
                Coordonnées & Informations professionnelles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Société / Agence
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SIRET
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Carte professionnelle CPI (Agences immobilières)
                </label>
                <input
                  type="text"
                  value={professionalCard}
                  onChange={(e) => setProfessionalCard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Présentation publique
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
              >
                Enregistrer mon profil annonceur
              </button>
            </form>
          )}

          
          {activeTab === 'settings' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await changeOwnPassword(user.id, currentPassword, newPassword);
                  setCurrentPassword('');
                  setNewPassword('');
                  showToast('Votre mot de passe a été modifié avec succès !', 'success');
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Erreur', 'error');
                }
              }}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-xl"
            >
              <h2 className="text-lg font-bold text-navy-950">Changer mon mot de passe</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe (min. 8 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
