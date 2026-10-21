import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Download,
  Heart,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  changeOwnPassword,
  deleteSavedSearch,
  getUserConversations,
  getUserFavorites,
  getUserNotifications,
  getUserSavedSearches,
  getViewingRequestsForUser,
  markNotificationRead,
  requestAccountDeletion,
  updateUserProfile,
  updateViewingRequestStatus,
} from '../services/erikalogService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

type StudentTab =
  | 'overview'
  | 'profile'
  | 'favorites'
  | 'searches'
  | 'visits'
  | 'notifications'
  | 'settings'
  | 'privacy';

export const StudentDashboardPage: React.FC = () => {
  const { user, setUser, refreshState, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as StudentTab) || 'overview';
  const [activeTab, setActiveTab] = useState<StudentTab>(initialTab);

  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [university, setUniversity] = useState(user?.university_or_school || '');
  const [studyCity, setStudyCity] = useState(user?.study_city || '');
  const [maxBudget, setMaxBudget] = useState(String(user?.max_budget || 750));
  const [guarantorType, setGuarantorType] = useState(user?.guarantor_type || 'visale');

  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  
  const [deletionReason, setDeletionReason] = useState('');

  if (!user) {
    return <Navigate to="/connexion?redirect=/etudiant" replace />;
  }

  const favorites = getUserFavorites(user.id);
  const savedSearches = getUserSavedSearches(user.id);
  const viewingRequests = getViewingRequestsForUser(user);
  const conversations = getUserConversations(user);
  const notifications = getUserNotifications(user.id);

  const switchTab = (tab: StudentTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateUserProfile(user.id, {
        full_name: fullName,
        phone,
        bio,
        university_or_school: university,
        study_city: studyCity,
        max_budget: Number(maxBudget) || 750,
        guarantor_type: guarantorType,
      });
      setUser(updated);
      refreshState();
      showToast('Votre profil étudiant a été mis à jour avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de mise à jour', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Les nouveaux mots de passe ne correspondent pas.', 'error');
      return;
    }
    try {
      await changeOwnPassword(user.id, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshState();
      showToast('Votre mot de passe a été modifié avec succès !', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors du changement', 'error');
    }
  };

  const handleVisitAction = async (
    requestId: string,
    status: 'accepted' | 'cancelled'
  ) => {
    try {
      await updateViewingRequestStatus(user, requestId, status, {
        advertiser_response:
          status === 'accepted'
            ? 'Créneau alternatif accepté par l’étudiant.'
            : 'Demande annulée par l’étudiant.',
      });
      refreshState();
      showToast(
        status === 'accepted'
          ? 'Vous avez accepté le nouveau créneau de visite !'
          : 'Demande de visite annulée.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleExportRgpdData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      platform: 'ErikaLog France',
      profile: user,
      favorites: favorites.map((f) => f.property?.title),
      saved_searches: savedSearches,
      viewing_requests: viewingRequests,
      conversations_count: conversations.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erikalog-export-rgpd-${user.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export JSON de vos données personnelles téléchargé.', 'success');
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionReason.trim()) {
      showToast('Veuillez indiquer le motif de votre demande.', 'info');
      return;
    }
    const updated = await requestAccountDeletion(user.id, deletionReason);
    setUser(updated);
    refreshState();
    showToast(
      'Votre demande de suppression de compte RGPD a été enregistrée et transmise à l’administrateur.',
      'info'
    );
  };

  const tabs: Array<{ id: StudentTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'profile', label: 'Mon profil locatif', icon: User },
    { id: 'favorites', label: 'Favoris', icon: Heart, badge: favorites.length },
    { id: 'searches', label: 'Recherches sauvées', icon: Bookmark, badge: savedSearches.length },
    { id: 'visits', label: 'Demandes de visite', icon: Calendar, badge: viewingRequests.length },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notifications.filter((n) => !n.is_read).length,
    },
    { id: 'settings', label: 'Mot de passe & Sécurité', icon: KeyRound },
    { id: 'privacy', label: 'Confidentialité & RGPD', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Mon Espace Étudiant | ErikaLog"
        description="Gérez votre profil locatif étudiant, vos favoris, vos demandes de visite et vos messages privés."
        canonicalPath="/etudiant"
      />

      
      <div className="bg-navy-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sage-600 text-xs font-bold uppercase">
              Espace Étudiant
            </span>
            {user.email_confirmed && (
              <span className="inline-flex items-center gap-1 text-xs text-sage-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> E-mail confirmé
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{user.full_name}</h1>
          <p className="text-xs text-slate-300">
            {user.university_or_school || 'Études supérieures en France'} • Ville recherchée :{' '}
            <strong>{user.study_city || 'France entière'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/recherche"
            className="px-4 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-500 text-xs font-bold text-white"
          >
            Rechercher un logement
          </Link>
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
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-sage-400' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      active ? 'bg-sage-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Logements favoris</span>
                  <p className="text-2xl font-extrabold text-navy-950 mt-1">{favorites.length}</p>
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
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Garantie déclarée</span>
                  <p className="text-base font-bold text-sage-700 mt-1.5 uppercase">
                    {user.guarantor_type || 'Visale'}
                  </p>
                </div>
              </div>

              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-navy-950">
                    Mes dernières demandes de visite
                  </h2>
                  <button
                    type="button"
                    onClick={() => switchTab('visits')}
                    className="text-xs font-semibold text-sage-700 hover:underline"
                  >
                    Voir tout →
                  </button>
                </div>

                {viewingRequests.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Vous n’avez pas encore envoyé de demande de visite.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {viewingRequests.slice(0, 3).map((vr) => (
                      <div
                        key={vr.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <Link
                            to={`/logement/${vr.property?.slug || ''}`}
                            className="text-sm font-bold text-navy-950 hover:text-sage-700"
                          >
                            {vr.property?.title || 'Logement ErikaLog'}
                          </Link>
                          <p className="text-xs text-slate-600">
                            Date souhaitée :{' '}
                            <strong>
                              {new Date(vr.preferred_date).toLocaleDateString('fr-FR')}
                            </strong>{' '}
                            • {vr.preferred_time_slot} (
                            {vr.visit_mode === 'video' ? 'En visio' : 'Sur place'})
                          </p>
                          {vr.advertiser_response && (
                            <p className="text-xs text-navy-900 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                              <strong>Réponse de l’annonceur :</strong> {vr.advertiser_response}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase self-start ${
                            vr.status === 'accepted'
                              ? 'bg-sage-100 text-sage-800'
                              : vr.status === 'alternative_proposed'
                              ? 'bg-amber-100 text-amber-800'
                              : vr.status === 'declined'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-navy-800'
                          }`}
                        >
                          {vr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-navy-950">
                  Mon Profil & Dossier Locatif Étudiant
                </h2>
                <p className="text-xs text-slate-500">
                  Ces informations valorisent votre candidature lorsque vous contactez un
                  propriétaire ou demandez une visite.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Université / École
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ville d’études principale
                  </label>
                  <input
                    type="text"
                    value={studyCity}
                    onChange={(e) => setStudyCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget mensuel max. CC (€)
                  </label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type de garant locatif
                  </label>
                  <select
                    value={guarantorType}
                    onChange={(e) => setGuarantorType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="visale">Garantie Visale (Action Logement)</option>
                    <option value="physical">Garants physiques (Parents / Proches)</option>
                    <option value="both">Garantie Visale + Garants physiques</option>
                    <option value="organisme">Organisme de cautionnement (Garantme, etc.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Présentation aux propriétaires (Bio locative)
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
                className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold"
              >
                Enregistrer mon profil
              </button>
            </form>
          )}

          
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Mes logements favoris ({favorites.length})
              </h2>
              {favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600">
                    Vous n’avez pas encore sauvegardé de logement en favori.
                  </p>
                  <Link
                    to="/recherche"
                    className="inline-block px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold"
                  >
                    Explorer les annonces
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favorites.map(
                    (f) => f.property && <PropertyCard key={f.id} property={f.property} />
                  )}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'searches' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Mes recherches enregistrées ({savedSearches.length})
              </h2>
              {savedSearches.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Enregistrez une recherche depuis la page de recherche pour la retrouver ici.
                </p>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-navy-950">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          Créée le {new Date(s.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/recherche?city=${encodeURIComponent(s.filters.city || '')}`}
                          className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold"
                        >
                          Relancer
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteSavedSearch(user.id, s.id);
                            refreshState();
                            showToast('Recherche supprimée.', 'info');
                          }}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'visits' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Historique de mes demandes de visite ({viewingRequests.length})
              </h2>
              {viewingRequests.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune demande de visite enregistrée.</p>
              ) : (
                <div className="space-y-4">
                  {viewingRequests.map((vr) => (
                    <div
                      key={vr.id}
                      className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/logement/${vr.property?.slug || ''}`}
                          className="text-base font-bold text-navy-950 hover:text-sage-700"
                        >
                          {vr.property?.title || 'Logement'}
                        </Link>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            vr.status === 'accepted'
                              ? 'bg-sage-100 text-sage-800'
                              : vr.status === 'alternative_proposed'
                              ? 'bg-amber-100 text-amber-800'
                              : vr.status === 'declined' || vr.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-navy-800'
                          }`}
                        >
                          {vr.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          Créneau demandé :{' '}
                          <strong>
                            {new Date(vr.preferred_date).toLocaleDateString('fr-FR')} —{' '}
                            {vr.preferred_time_slot}
                          </strong>
                        </div>
                        <div>
                          Mode :{' '}
                          <strong>
                            {vr.visit_mode === 'video' ? 'Visite en visio' : 'Visite sur place'}
                          </strong>
                        </div>
                      </div>

                      {vr.proposed_date && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <strong>Nouveau créneau proposé par l’annonceur :</strong>{' '}
                          {new Date(vr.proposed_date).toLocaleDateString('fr-FR')} (
                          {vr.proposed_time_slot})
                        </div>
                      )}

                      {vr.advertiser_response && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                          <strong>Réponse de {vr.advertiser?.full_name || 'l’annonceur'} :</strong>{' '}
                          {vr.advertiser_response}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {vr.status === 'alternative_proposed' && (
                          <button
                            type="button"
                            onClick={() => handleVisitAction(vr.id, 'accepted')}
                            className="px-3.5 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold"
                          >
                            Accepter ce nouveau créneau
                          </button>
                        )}
                        {['pending', 'accepted', 'alternative_proposed'].includes(vr.status) && (
                          <button
                            type="button"
                            onClick={() => handleVisitAction(vr.id, 'cancelled')}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 text-xs font-semibold"
                          >
                            Annuler la visite
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy-950">
                  Mes notifications ({notifications.length})
                </h2>
                <button
                  type="button"
                  onClick={async () => {
                    await markNotificationRead(user.id);
                    refreshState();
                    showToast('Toutes les notifications ont été marquées comme lues.', 'info');
                  }}
                  className="text-xs font-semibold text-sage-700 hover:underline"
                >
                  Tout marquer comme lu
                </button>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border text-xs space-y-1 ${
                      n.is_read
                        ? 'bg-white border-slate-200 text-slate-600'
                        : 'bg-sage-50/70 border-sage-300 text-navy-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{n.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(n.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {activeTab === 'settings' && (
            <form
              onSubmit={handlePasswordChange}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-xl"
            >
              <h2 className="text-lg font-bold text-navy-950">
                Modifier mon mot de passe & Sécurité
              </h2>
              <p className="text-xs text-slate-600">
                Vous pouvez changer le mot de passe de votre compte à tout moment.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe (minimum 8 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold"
              >
                Mettre à jour mon mot de passe
              </button>
            </form>
          )}

          
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-navy-950">
                  Portabilité et accès à mes données (RGPD)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conformément à l’article 20 du RGPD, téléchargez une copie complète des données
                  associées à votre compte étudiant au format JSON structuré.
                </p>
                <button
                  type="button"
                  onClick={handleExportRgpdData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter mes données personnelles (JSON)</span>
                </button>
              </div>

              <form
                onSubmit={handleRequestDeletion}
                className="bg-white rounded-2xl border border-red-200 p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-red-700">
                  Demander la suppression de mon compte
                </h2>
                <p className="text-xs text-slate-600">
                  Statut actuel du compte : <strong>{user.status}</strong>. Vous pouvez solliciter
                  la suppression et l’anonymisation de vos données personnelles.
                </p>
                <textarea
                  rows={2}
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Motif de la demande de suppression..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Envoyer la demande de suppression RGPD
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
