import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Flag,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  adminChangeUserPassword,
  adminModerateProperty,
  adminResolveReport,
  adminSaveCity,
  adminSaveCmsArticle,
  adminSaveCmsPage,
  adminSaveFaq,
  adminUpdateSiteSettings,
  adminUpdateUserAccount,
  getAdminDashboardData,
} from '../services/erikalogService';
import { SeoHead } from '../components/SeoHead';
import type { CmsArticle, CmsPage, EditorialStatus, PropertyStatus, UserRole, UserStatus } from '../types/database';

type AdminTab =
  | 'overview'
  | 'properties'
  | 'users'
  | 'reports'
  | 'cms_pages'
  | 'cms_articles'
  | 'cms_faqs_cities'
  | 'settings'
  | 'logs';

export const AdminDashboardPage: React.FC = () => {
  const { user, refreshState, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  
  const [propStatusFilter, setPropStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [rejectingPropertyId, setRejectingPropertyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(
    'Merci de compléter le diagnostic énergétique DPE et de vérifier la cohérence des charges.'
  );

  
  const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');

  
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [reportDecision, setReportDecision] = useState('');
  const [reportActionTaken, setReportActionTaken] = useState('Avertissement envoyé à l’annonceur');
  const [suspendReportedProp, setSuspendReportedProp] = useState(false);

  
  const [editingPage, setEditingPage] = useState<Partial<CmsPage> | null>(null);
  
  const [editingArticle, setEditingArticle] = useState<Partial<CmsArticle> | null>(null);
  
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Étudiants');

  
  const [cityName, setCityName] = useState('');
  const [cityDept, setCityDept] = useState('');
  const [cityRegion, setCityRegion] = useState('');
  const [cityRent, setCityRent] = useState(550);
  const [cityDesc, setCityDesc] = useState('');

  if (!user) {
    return <Navigate to="/connexion?redirect=/admin" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-navy-950">
          Accès strictement réservé aux Administrateurs ErikaLog
        </h1>
        <p className="text-sm text-slate-600">
          Votre compte ({user.role}) ne dispose pas des privilèges d’administration. Toute tentative
          non autorisée est bloquée côté serveur.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
        >
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  const data = getAdminDashboardData(user);
  const [settingsForm, setSettingsForm] = useState(data.siteSettings);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredProperties = data.properties.filter((p) =>
    propStatusFilter === 'all' ? true : p.status === propStatusFilter
  );

  const filteredUsers = data.profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleModerate = async (
    propertyId: string,
    status: PropertyStatus,
    reason?: string
  ) => {
    try {
      await adminModerateProperty(user, propertyId, status, reason);
      setRejectingPropertyId(null);
      refreshState();
      showToast(`Annonce passée au statut "${status}" et journalisée.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de modération', 'error');
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUserId) return;
    try {
      await adminChangeUserPassword(user.id, passwordModalUserId, adminNewPassword);
      setPasswordModalUserId(null);
      setAdminNewPassword('');
      refreshState();
      showToast(
        'Le mot de passe de l’utilisateur a été modifié avec succès sur Supabase et journalisé.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Back-Office Administrateur & CMS | ErikaLog"
        description="Administration de la plateforme ErikaLog : modération, utilisateurs, signalements et CMS."
        canonicalPath="/admin"
      />

      
      <div className="bg-navy-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-navy-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sage-600 text-xs font-bold uppercase inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Back-Office & CMS ErikaLog
            </span>
            <span className="text-xs text-slate-400">
              Connecté : {user.full_name} ({user.email})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold">Centre de pilotage, Modération & CMS</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPropStatusFilter('pending');
              switchTab('properties');
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 text-xs font-extrabold"
          >
            {data.properties.filter((p) => p.status === 'pending').length} annonce(s) à modérer
          </button>
          <button
            type="button"
            onClick={() => switchTab('reports')}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
          >
            {data.reports.filter((r) => r.status === 'open').length} signalement(s)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3 space-y-1">
          {[
            { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
            {
              id: 'properties',
              label: 'Modération Annonces',
              icon: Building2,
              badge: data.properties.filter((p) => p.status === 'pending').length,
            },
            { id: 'users', label: 'Utilisateurs & Accès', icon: Users, badge: data.profiles.length },
            {
              id: 'reports',
              label: 'Signalements',
              icon: Flag,
              badge: data.reports.filter((r) => r.status === 'open').length,
            },
            { id: 'cms_pages', label: 'CMS Pages & Légal', icon: FileText },
            { id: 'cms_articles', label: 'CMS Guides & Blog', icon: BookOpen },
            { id: 'cms_faqs_cities', label: 'CMS FAQ & Villes', icon: MapPin },
            { id: 'settings', label: 'Paramètres & SEO', icon: Settings },
            { id: 'logs', label: 'Journaux d’audit', icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchTab(item.id as AdminTab)}
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
                  <span className="text-xs font-semibold text-slate-500">Utilisateurs inscrits</span>
                  <p className="text-2xl font-extrabold text-navy-950 mt-1">
                    {data.profiles.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {data.profiles.filter((p) => p.role === 'student').length} étudiants •{' '}
                    {data.profiles.filter((p) => p.role === 'owner' || p.role === 'agent').length}{' '}
                    annonceurs
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Annonces publiées</span>
                  <p className="text-2xl font-extrabold text-sage-700 mt-1">
                    {data.properties.filter((p) => p.status === 'published').length}
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    {data.properties.filter((p) => p.status === 'pending').length} en attente de
                    validation
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">Demandes de visite</span>
                  <p className="text-2xl font-extrabold text-navy-950 mt-1">
                    {data.viewingRequests.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {data.conversationsCount} conversations actives
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <span className="text-xs font-semibold text-slate-500">
                    Signalements à traiter
                  </span>
                  <p className="text-2xl font-extrabold text-red-600 mt-1">
                    {data.reports.filter((r) => r.status === 'open').length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {data.moderationLogs.length} actions de modération
                  </p>
                </div>
              </div>

              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-navy-950">
                  File d’attente de modération prioritaire
                </h2>
                {data.properties.filter((p) => p.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Toutes les annonces en attente ont été traitées.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.properties
                      .filter((p) => p.status === 'pending')
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-navy-950">{p.title}</p>
                            <p className="text-xs text-slate-600">
                              Annonceur : <strong>{p.owner?.full_name}</strong> • {p.city_name} (
                              {p.postal_code}) • {p.surface_m2} m² •{' '}
                              <strong>{p.rent_including_charges} €/mois CC</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleModerate(
                                  p.id,
                                  'published',
                                  'Annonce vérifiée et approuvée par l’administrateur.'
                                )
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold"
                            >
                              Approuver & Publier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPropertyId(p.id);
                                switchTab('properties');
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                            >
                              Rejeter
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
          {activeTab === 'properties' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-navy-950">
                  Gestion et modération de toutes les annonces ({data.properties.length})
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'pending', 'published', 'rejected', 'suspended', 'archived'].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPropStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${
                          propStatusFilter === st
                            ? 'bg-navy-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {st === 'all' ? 'Toutes' : st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {filteredProperties.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{p.reference}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                              p.status === 'published'
                                ? 'bg-sage-100 text-sage-800'
                                : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-navy-950">{p.title}</h3>
                        <p className="text-xs text-slate-600">
                          Par <strong>{p.owner?.full_name}</strong> ({p.owner?.email}) •{' '}
                          {p.city_name} ({p.postal_code}) • {p.surface_m2} m² •{' '}
                          <strong>{p.rent_including_charges} €/mois CC</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/logement/${p.slug}`}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-navy-950"
                          title="Prévisualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {p.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleModerate(
                                p.id,
                                'published',
                                'Annonce approuvée par la modération.'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Publier</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setRejectingPropertyId(rejectingPropertyId === p.id ? null : p.id)
                          }
                          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>
                        {p.status !== 'suspended' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleModerate(
                                p.id,
                                'suspended',
                                'Annonce suspendue par l’administrateur.'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold"
                          >
                            Suspendre
                          </button>
                        )}
                      </div>
                    </div>

                    {rejectingPropertyId === p.id && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                        <label className="block text-xs font-bold text-red-900">
                          Motif du rejet communiqué à l’annonceur :
                        </label>
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-red-300 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'rejected', rejectionReason)}
                          className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                        >
                          Confirmer le rejet
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-navy-950">
                    Gestion des comptes, Rôles & Mots de passe ({data.profiles.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modifiez les rôles, vérifiez les annonceurs, suspendez un compte ou changez le
                    mot de passe de n’importe quel utilisateur.
                  </p>
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher par nom, e-mail, rôle..."
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:w-64"
                />
              </div>

              <div className="space-y-3">
                {filteredUsers.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-navy-950">{prof.full_name}</span>
                        <span className="px-2 py-0.5 rounded bg-navy-100 text-navy-900 text-[11px] font-bold uppercase">
                          {prof.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            prof.status === 'active'
                              ? 'bg-sage-100 text-sage-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {prof.status}
                        </span>
                        {prof.is_verified && (
                          <span className="text-[11px] text-sage-700 font-semibold">
                            ✓ Vérifié
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {prof.email} {prof.phone ? `• ${prof.phone}` : ''}
                      </p>
                      {prof.deletion_reason && (
                        <p className="text-xs text-red-700 font-medium">
                          Demande suppression RGPD : {prof.deletion_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={prof.role}
                        onChange={async (e) => {
                          await adminUpdateUserAccount(user, prof.id, {
                            role: e.target.value as UserRole,
                            status: prof.status,
                            is_verified: prof.is_verified,
                          });
                          refreshState();
                          showToast(`Rôle de ${prof.full_name} mis à jour.`, 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-semibold"
                      >
                        <option value="student">Étudiant</option>
                        <option value="owner">Propriétaire</option>
                        <option value="agent">Agent / Agence</option>
                        <option value="admin">Administrateur</option>
                      </select>

                      <button
                        type="button"
                        onClick={async () => {
                          await adminUpdateUserAccount(user, prof.id, {
                            role: prof.role,
                            status: prof.status,
                            is_verified: !prof.is_verified,
                          });
                          refreshState();
                          showToast('Statut de vérification modifié.', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                      >
                        {prof.is_verified ? 'Retirer badge' : 'Vérifier'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const nextStatus: UserStatus =
                            prof.status === 'suspended' ? 'active' : 'suspended';
                          await adminUpdateUserAccount(user, prof.id, {
                            role: prof.role,
                            status: nextStatus,
                            is_verified: prof.is_verified,
                          });
                          refreshState();
                          showToast(`Compte ${nextStatus}.`, 'info');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold"
                      >
                        {prof.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPasswordModalUserId(
                            passwordModalUserId === prof.id ? null : prof.id
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-sage-400" />
                        <span>Changer Mdp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {passwordModalUserId && (
                <form
                  onSubmit={handleAdminResetPassword}
                  className="p-4 rounded-2xl bg-navy-950 text-white space-y-3"
                >
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sage-400" />
                    <span>
                      Définir un nouveau mot de passe pour{' '}
                      {data.profiles.find((p) => p.id === passwordModalUserId)?.email}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      minLength={8}
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe (min. 8 caractères)"
                      className="flex-1 px-3 py-2 rounded-xl text-slate-900 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold"
                    >
                      Appliquer le nouveau mot de passe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordModalUserId(null)}
                      className="px-3 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Signalements utilisateurs & Dossiers de modération ({data.reports.length})
              </h2>
              {data.reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Motif : {rep.reason_category} ({rep.target_type})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-900 text-xs font-bold uppercase">
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800">{rep.description}</p>
                  {rep.target_property && (
                    <p className="text-xs text-sage-800 font-semibold">
                      Annonce ciblée : {rep.target_property.title} ({rep.target_property.reference})
                    </p>
                  )}
                  {rep.admin_decision && (
                    <p className="text-xs text-navy-900 bg-white p-3 rounded-xl border border-slate-200">
                      <strong>Décision documentée :</strong> {rep.admin_decision} — Action :{' '}
                      {rep.action_taken}
                    </p>
                  )}
                  {rep.status === 'open' && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setResolvingReportId(resolvingReportId === rep.id ? null : rep.id)
                        }
                        className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
                      >
                        Traiter et clôturer ce signalement
                      </button>
                    </div>
                  )}

                  {resolvingReportId === rep.id && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                      <input
                        type="text"
                        value={reportDecision}
                        onChange={(e) => setReportDecision(e.target.value)}
                        placeholder="Décision de modération motivée..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={reportActionTaken}
                        onChange={(e) => setReportActionTaken(e.target.value)}
                        placeholder="Mesure appliquée..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-red-700 font-semibold">
                        <input
                          type="checkbox"
                          checked={suspendReportedProp}
                          onChange={(e) => setSuspendReportedProp(e.target.checked)}
                        />
                        <span>Suspendre immédiatement l’annonce concernée</span>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminResolveReport(user, rep.id, {
                            status: 'resolved',
                            decision: reportDecision || 'Vérification effectuée.',
                            actionTaken: reportActionTaken,
                            suspendProperty: suspendReportedProp,
                          });
                          setResolvingReportId(null);
                          refreshState();
                          showToast('Signalement traité et clôturé.', 'success');
                        }}
                        className="px-4 py-2 rounded-lg bg-sage-600 text-white text-xs font-bold"
                      >
                        Valider la décision
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          
          {activeTab === 'cms_pages' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy-950">
                    CMS — Pages publiques & Pages légales
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modifiez les textes, statuts de publication et balises SEO sans toucher au code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingPage({
                      slug: 'nouvelle-page',
                      title: 'Nouvelle page ErikaLog',
                      subtitle: '',
                      content: 'Contenu de la page...',
                      status: 'published',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold"
                >
                  + Nouvelle page
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.cmsPages.map((pg) => (
                  <div
                    key={pg.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-navy-950">{pg.title}</p>
                      <p className="text-xs text-slate-500">
                        /{pg.slug} • Statut : <strong>{pg.status}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPage(pg)}
                      className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold"
                    >
                      Éditer
                    </button>
                  </div>
                ))}
              </div>

              {editingPage && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingPage.slug || !editingPage.title || !editingPage.content) return;
                    await adminSaveCmsPage(user, {
                      id: editingPage.id,
                      slug: editingPage.slug,
                      title: editingPage.title,
                      subtitle: editingPage.subtitle || null,
                      content: editingPage.content,
                      status: (editingPage.status as EditorialStatus) || 'published',
                      seo_title: editingPage.seo_title || null,
                      seo_description: editingPage.seo_description || null,
                    });
                    setEditingPage(null);
                    refreshState();
                    showToast('Page CMS enregistrée et publiée !', 'success');
                  }}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                >
                  <h3 className="text-sm font-bold text-navy-950">
                    Édition de la page : /{editingPage.slug}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={editingPage.slug || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                      placeholder="Slug URL"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={editingPage.title || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                      placeholder="Titre de la page"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <select
                      value={editingPage.status || 'published'}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          status: e.target.value as EditorialStatus,
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={editingPage.content || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editingPage.seo_title || ''}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, seo_title: e.target.value })
                      }
                      placeholder="Titre SEO (balise title)"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={editingPage.seo_description || ''}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, seo_description: e.target.value })
                      }
                      placeholder="Meta Description SEO"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold"
                    >
                      Enregistrer la page
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPage(null)}
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Fermer
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          
          {activeTab === 'cms_articles' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy-950">
                  CMS — Guides étudiants & Articles ({data.cmsArticles.length})
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingArticle({
                      slug: `guide-etudiant-${Date.now()}`,
                      title: 'Nouveau guide pratique étudiant',
                      category: 'Conseils Étudiants',
                      excerpt: 'Résumé du guide pratique...',
                      content: 'Contenu détaillé du guide...',
                      status: 'published',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold"
                >
                  + Nouvel article
                </button>
              </div>

              <div className="space-y-3">
                {data.cmsArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-sage-700 uppercase">
                        {art.category} • {art.status}
                      </span>
                      <h3 className="text-sm font-bold text-navy-950">{art.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingArticle(art)}
                      className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold"
                    >
                      Modifier
                    </button>
                  </div>
                ))}
              </div>

              {editingArticle && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      !editingArticle.slug ||
                      !editingArticle.title ||
                      !editingArticle.content
                    )
                      return;
                    await adminSaveCmsArticle(user, {
                      id: editingArticle.id,
                      slug: editingArticle.slug,
                      title: editingArticle.title,
                      excerpt: editingArticle.excerpt || editingArticle.title,
                      content: editingArticle.content,
                      category: editingArticle.category || 'Budget & Aides',
                      status: (editingArticle.status as EditorialStatus) || 'published',
                      seo_title: editingArticle.seo_title || null,
                      seo_description: editingArticle.seo_description || null,
                    });
                    setEditingArticle(null);
                    refreshState();
                    showToast('Article enregistré dans le CMS !', 'success');
                  }}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={editingArticle.title || ''}
                      onChange={(e) =>
                        setEditingArticle({ ...editingArticle, title: e.target.value })
                      }
                      placeholder="Titre du guide"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={editingArticle.category || ''}
                      onChange={(e) =>
                        setEditingArticle({ ...editingArticle, category: e.target.value })
                      }
                      placeholder="Catégorie"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <select
                      value={editingArticle.status || 'published'}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          status: e.target.value as EditorialStatus,
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={editingArticle.excerpt || ''}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, excerpt: e.target.value })
                    }
                    placeholder="Chapô / Résumé"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <textarea
                    rows={6}
                    value={editingArticle.content || ''}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, content: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold"
                    >
                      Publier l’article
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingArticle(null)}
                      className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          
          {activeTab === 'cms_faqs_cities' && (
            <div className="space-y-6">
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await adminSaveFaq(user, {
                    question: faqQuestion,
                    answer: faqAnswer,
                    category: faqCategory,
                    status: 'published',
                  });
                  setFaqQuestion('');
                  setFaqAnswer('');
                  refreshState();
                  showToast('Nouvelle question ajoutée à la FAQ !', 'success');
                }}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-navy-950">
                  CMS — Ajouter une question à la FAQ ({data.faqs.length} actives)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="Question..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <select
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Étudiants">Étudiants</option>
                    <option value="Propriétaires & Agences">Propriétaires & Agences</option>
                    <option value="Visites & Dossier">Visites & Dossier</option>
                    <option value="Sécurité & Modération">Sécurité & Modération</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Réponse détaillée..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
                >
                  Ajouter à la FAQ
                </button>
              </form>

              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await adminSaveCity(user, {
                    name: cityName,
                    slug: cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    department: cityDept,
                    region: cityRegion,
                    avg_student_rent: Number(cityRent),
                    description: cityDesc,
                  });
                  setCityName('');
                  setCityDept('');
                  setCityRegion('');
                  setCityDesc('');
                  refreshState();
                  showToast('Ville étudiante ajoutée / mise à jour !', 'success');
                }}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-navy-950">
                  CMS — Villes étudiantes référencées ({data.cities.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Nom (ex: Nantes)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={cityDept}
                    onChange={(e) => setCityDept(e.target.value)}
                    placeholder="Département (ex: 44)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={cityRegion}
                    onChange={(e) => setCityRegion(e.target.value)}
                    placeholder="Région"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="number"
                    value={cityRent}
                    onChange={(e) => setCityRent(Number(e.target.value))}
                    placeholder="Loyer moyen (€)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={cityDesc}
                  onChange={(e) => setCityDesc(e.target.value)}
                  placeholder="Présentation universitaire de la ville..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold"
                >
                  Enregistrer la ville étudiante
                </button>
              </form>
            </div>
          )}

          
          {activeTab === 'settings' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminUpdateSiteSettings(user, settingsForm);
                refreshState();
                showToast('Paramètres globaux et SEO mis à jour !', 'success');
              }}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
            >
              <h2 className="text-lg font-bold text-navy-950">
                Paramètres généraux du site, Textes d’accueil & Fonctionnalités
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du site
                  </label>
                  <input
                    type="text"
                    value={settingsForm.site_name}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, site_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail de contact public
                  </label>
                  <input
                    type="email"
                    value={settingsForm.contact_email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre Hero de la page d’accueil
                </label>
                <input
                  type="text"
                  value={settingsForm.hero_title}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, hero_title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sous-titre Hero de la page d’accueil
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.hero_subtitle}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsForm.require_moderation_before_publish}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        require_moderation_before_publish: e.target.checked,
                      })
                    }
                  />
                  <span>Exiger la modération avant toute publication d’annonce</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsForm.revalidate_on_sensitive_edit}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        revalidate_on_sensitive_edit: e.target.checked,
                      })
                    }
                  />
                  <span>Revalidation automatique si modification du loyer/adresse</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsForm.enable_visit_requests}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        enable_visit_requests: e.target.checked,
                      })
                    }
                  />
                  <span>Activer le module de demandes de visite</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_demo_badge}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        show_demo_badge: e.target.checked,
                      })
                    }
                  />
                  <span>Afficher le badge « Démo vérifiée » sur les annonces d’essai</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
              >
                Enregistrer la configuration globale
              </button>
            </form>
          )}

          
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-950">
                Journaux des actions administratives & de modération ({data.auditLogs.length})
              </h2>
              <div className="space-y-2.5">
                {data.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-navy-900">{log.action_type}</span>
                      <span className="text-slate-500 ml-2">
                        ({log.entity_type} #{log.entity_id?.slice(0, 12)})
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
