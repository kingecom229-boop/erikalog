import { supabase } from '../lib/supabase';
import {
  canTransitionPropertyStatus,
  canUserAccessConversation,
  canUserModifyProperty,
  canUserPublishProperty,
  isSensitivePropertyChange,
  sanitizeText,
} from '../lib/validation';
import {
  INITIAL_AMENITIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CITIES,
  INITIAL_CMS_ARTICLES,
  INITIAL_CMS_PAGES,
  INITIAL_CONVERSATIONS,
  INITIAL_FAQS,
  INITIAL_FAVORITES,
  INITIAL_MESSAGES,
  INITIAL_MODERATION_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PASSWORDS,
  INITIAL_PROFILES,
  INITIAL_PROPERTIES,
  INITIAL_REPORTS,
  INITIAL_SAVED_SEARCHES,
  INITIAL_SITE_SETTINGS,
  INITIAL_VIEWING_REQUESTS,
} from '../data/initialDatabaseState';
import type {
  AdminAuditLog,
  Amenity,
  AppNotification,
  City,
  CmsArticle,
  CmsPage,
  Conversation,
  FaqItem,
  Favorite,
  Message,
  ModerationLog,
  Profile,
  Property,
  PropertyStatus,
  Report,
  ReportStatus,
  SavedSearch,
  SearchFilters,
  SiteSettings,
  UserRole,
  UserStatus,
  ViewingRequest,
  ViewingStatus,
} from '../types/database';

const STORAGE_KEY = 'erikalog_db_state_v1';
const SESSION_KEY = 'erikalog_active_user_id';

export function digestPassword(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'erk_h$' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

interface LocalDatabaseState {
  profiles: Profile[];
  passwords: Record<string, string>;
  cities: City[];
  amenities: Amenity[];
  properties: Property[];
  favorites: Favorite[];
  savedSearches: SavedSearch[];
  conversations: Conversation[];
  messages: Message[];
  viewingRequests: ViewingRequest[];
  notifications: AppNotification[];
  reports: Report[];
  moderationLogs: ModerationLog[];
  auditLogs: AdminAuditLog[];
  cmsPages: CmsPage[];
  cmsArticles: CmsArticle[];
  faqs: FaqItem[];
  siteSettings: SiteSettings;
}

function getDefaultState(): LocalDatabaseState {
  return {
    profiles: structuredClone(INITIAL_PROFILES),
    passwords: { ...INITIAL_PASSWORDS },
    cities: structuredClone(INITIAL_CITIES),
    amenities: structuredClone(INITIAL_AMENITIES),
    properties: structuredClone(INITIAL_PROPERTIES),
    favorites: structuredClone(INITIAL_FAVORITES),
    savedSearches: structuredClone(INITIAL_SAVED_SEARCHES),
    conversations: structuredClone(INITIAL_CONVERSATIONS),
    messages: structuredClone(INITIAL_MESSAGES),
    viewingRequests: structuredClone(INITIAL_VIEWING_REQUESTS),
    notifications: structuredClone(INITIAL_NOTIFICATIONS),
    reports: structuredClone(INITIAL_REPORTS),
    moderationLogs: structuredClone(INITIAL_MODERATION_LOGS),
    auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
    cmsPages: structuredClone(INITIAL_CMS_PAGES),
    cmsArticles: structuredClone(INITIAL_CMS_ARTICLES),
    faqs: structuredClone(INITIAL_FAQS),
    siteSettings: structuredClone(INITIAL_SITE_SETTINGS),
  };
}

let memoryState: LocalDatabaseState | null = null;

function loadState(): LocalDatabaseState {
  if (memoryState) return memoryState;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalDatabaseState;
        if (parsed && Array.isArray(parsed.properties) && Array.isArray(parsed.profiles)) {
          memoryState = parsed;
          return memoryState;
        }
      }
    }
  } catch {

  }
  memoryState = getDefaultState();
  saveState(memoryState);
  return memoryState;
}

function saveState(state: LocalDatabaseState): void {
  memoryState = state;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {

  }
}

export function resetLocalDatabaseState(): void {
  memoryState = getDefaultState();
  saveState(memoryState);
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase timeout')), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function hydrateProperty(prop: Property, state: LocalDatabaseState): Property {
  const owner = state.profiles.find((p) => p.id === prop.owner_id);
  return {
    ...prop,
    rent_including_charges: Number(prop.rent_excluding_charges) + Number(prop.charges_amount),
    owner,
    images:
      prop.images && prop.images.length > 0
        ? [...prop.images].sort((a, b) => a.display_order - b.display_order)
        : [
            {
              id: `img-${prop.id}`,
              property_id: prop.id,
              url:
                prop.cover_image_url ||
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
              alt_text: prop.title,
              display_order: 1,
              is_primary: true,
            },
          ],
    amenities: prop.amenities || [],
  };
}

export async function syncFromSupabase(): Promise<boolean> {
  try {
    const [propsRes, citiesRes, profilesRes, settingsRes, pagesRes, articlesRes, faqsRes] =
      await Promise.all([
        withTimeout(
          supabase
            .from('properties')
            .select('*, property_images(*), property_amenities(amenity_slug)')
            .order('created_at', { ascending: false }),
          3000
        ),
        withTimeout(supabase.from('cities').select('*').order('display_order', { ascending: true }), 3000),
        withTimeout(supabase.from('profiles').select('*'), 3000),
        withTimeout(supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(), 3000),
        withTimeout(supabase.from('pages').select('*'), 3000),
        withTimeout(supabase.from('articles').select('*').order('published_at', { ascending: false }), 3000),
        withTimeout(supabase.from('faqs').select('*').order('display_order', { ascending: true }), 3000),
      ]);

    const state = loadState();

    if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
      state.profiles = profilesRes.data as Profile[];
    }
    if (!citiesRes.error && citiesRes.data && citiesRes.data.length > 0) {
      state.cities = citiesRes.data as City[];
    }
    if (!propsRes.error && propsRes.data && propsRes.data.length > 0) {
      state.properties = propsRes.data.map((row: Record<string, unknown>) => {
        const imgs = Array.isArray(row.property_images) ? row.property_images : [];
        const ams = Array.isArray(row.property_amenities)
          ? row.property_amenities.map((a: { amenity_slug: string }) => a.amenity_slug)
          : [];
        return {
          ...(row as unknown as Property),
          surface_m2: Number(row.surface_m2),
          rent_excluding_charges: Number(row.rent_excluding_charges),
          charges_amount: Number(row.charges_amount),
          rent_including_charges:
            Number(row.rent_excluding_charges) + Number(row.charges_amount),
          images: imgs,
          amenities: ams,
        };
      });
    }
    if (!settingsRes.error && settingsRes.data) {
      state.siteSettings = settingsRes.data as SiteSettings;
    }
    if (!pagesRes.error && pagesRes.data && pagesRes.data.length > 0) {
      state.cmsPages = pagesRes.data as CmsPage[];
    }
    if (!articlesRes.error && articlesRes.data && articlesRes.data.length > 0) {
      state.cmsArticles = articlesRes.data as CmsArticle[];
    }
    if (!faqsRes.error && faqsRes.data && faqsRes.data.length > 0) {
      state.faqs = faqsRes.data as FaqItem[];
    }

    saveState(state);
    return true;
  } catch {
    return false;
  }
}

export function getActiveSessionUser(): Profile | null {
  const state = loadState();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const uid = window.localStorage.getItem(SESSION_KEY);
      if (uid) {
        const found = state.profiles.find((p) => p.id === uid);
        if (found && found.status !== 'suspended') return found;
      }
    }
  } catch {

  }
  return null;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const state = loadState();

  
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: cleanEmail, password }),
      2500
    );
    if (!error && data.user) {
      const { data: profileData } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
        2000
      );
      if (profileData) {
        const prof = profileData as Profile;
        if (prof.status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('Votre compte a été suspendu par la modération ErikaLog.');
        }
        const idx = state.profiles.findIndex((p) => p.id === prof.id);
        if (idx >= 0) state.profiles[idx] = prof;
        else state.profiles.push(prof);
        state.passwords[cleanEmail] = digestPassword(password);
        saveState(state);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SESSION_KEY, prof.id);
        }
        return { user: prof };
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('suspendu')) {
      throw err;
    }
  }

  const profile = state.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
  const expectedDigest = state.passwords[cleanEmail];
  const candidateDigest = digestPassword(password);
  if (!profile || !expectedDigest || expectedDigest !== candidateDigest) {
    throw new Error('Identifiants incorrects. Vérifiez votre adresse e-mail et votre mot de passe.');
  }
  if (profile.status === 'suspended') {
    throw new Error('Votre compte a été suspendu par l’équipe de modération ErikaLog.');
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, profile.id);
  }
  return { user: profile };
}

export async function registerNewAccount(input: {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'owner' | 'agent';
  accountType: 'student' | 'individual_owner' | 'real_estate_agent' | 'residence_manager';
  phone: string;
  universityOrSchool?: string;
  studyCity?: string;
  companyName?: string;
  siret?: string;
  professionalCard?: string;
}): Promise<Profile> {
  const state = loadState();
  const cleanEmail = input.email.trim().toLowerCase();

  
  const safeRole: UserRole =
    input.role === 'owner' || input.role === 'agent' ? input.role : 'student';

  if (safeRole === 'student' && !state.siteSettings.enable_student_registration) {
    throw new Error('Les inscriptions étudiantes sont temporairement fermées.');
  }
  if (safeRole !== 'student' && !state.siteSettings.enable_advertiser_registration) {
    throw new Error('Les inscriptions annonceurs sont temporairement fermées.');
  }

  if (state.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
    throw new Error('Un compte existe déjà avec cette adresse e-mail.');
  }

  let newUserId: string = crypto.randomUUID();

  
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: cleanEmail,
        password: input.password,
        options: {
          data: {
            full_name: sanitizeText(input.fullName),
            role: safeRole,
            account_type: input.accountType,
            phone: sanitizeText(input.phone),
            university_or_school: input.universityOrSchool ? sanitizeText(input.universityOrSchool) : null,
            study_city: input.studyCity ? sanitizeText(input.studyCity) : null,
            company_name: input.companyName ? sanitizeText(input.companyName) : null,
            siret: input.siret ? sanitizeText(input.siret) : null,
            professional_card: input.professionalCard ? sanitizeText(input.professionalCard) : null,
          },
        },
      }),
      3000
    );
    if (!error && data.user) {
      newUserId = data.user.id;
    }
  } catch {

  }

  const now = new Date().toISOString();
  const newProfile: Profile = {
    id: newUserId,
    email: cleanEmail,
    full_name: sanitizeText(input.fullName),
    role: safeRole,
    account_type: input.accountType,
    phone: sanitizeText(input.phone),
    avatar_url: null,
    bio: null,
    university_or_school: input.universityOrSchool ? sanitizeText(input.universityOrSchool) : null,
    study_city: input.studyCity ? sanitizeText(input.studyCity) : null,
    max_budget: safeRole === 'student' ? 750 : null,
    guarantor_type: safeRole === 'student' ? 'visale' : null,
    company_name: input.companyName ? sanitizeText(input.companyName) : null,
    siret: input.siret ? sanitizeText(input.siret) : null,
    professional_card: input.professionalCard ? sanitizeText(input.professionalCard) : null,
    organization_id: null,
    is_verified: false,
    email_confirmed: true,
    status: 'active',
    notification_prefs: {
      email_messages: true,
      email_viewings: true,
      email_moderation: true,
      in_app_all: true,
    },
    created_at: now,
    updated_at: now,
  };

  state.profiles.push(newProfile);
  state.passwords[cleanEmail] = digestPassword(input.password);
  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: newProfile.id,
    type: 'account_welcome',
    title: 'Bienvenue sur ErikaLog !',
    message:
      'Votre compte est confirmé et actif. Complétez votre profil pour profiter pleinement de la plateforme.',
    link_url: safeRole === 'student' ? '/etudiant' : '/annonceur',
    is_read: false,
    email_dispatched: true,
    created_at: now,
  });

  saveState(state);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, newProfile.id);
  }
  return newProfile;
}

export async function signOutUser(): Promise<void> {
  try {
    await withTimeout(supabase.auth.signOut(), 1500);
  } catch {

  }
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
  }
  const state = loadState();
  const profile = state.profiles.find((p) => p.id === userId);
  if (!profile) throw new Error('Utilisateur introuvable.');

  const emailKey = profile.email.toLowerCase();
  const currentDigest = digestPassword(currentPassword);
  if (state.passwords[emailKey] && state.passwords[emailKey] !== currentDigest) {
    throw new Error('Le mot de passe actuel saisi est incorrect.');
  }

  try {
    await withTimeout(supabase.auth.updateUser({ password: newPassword }), 2500);
  } catch {

  }

  state.passwords[emailKey] = digestPassword(newPassword);
  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: userId,
    type: 'security_alert',
    title: 'Mot de passe mis à jour',
    message: 'Votre mot de passe ErikaLog vient d’être modifié avec succès.',
    link_url: null,
    is_read: false,
    email_dispatched: true,
    created_at: new Date().toISOString(),
  });
  saveState(state);
}

export async function adminChangeUserPassword(
  adminId: string,
  targetUserId: string,
  newPassword: string
): Promise<void> {
  const state = loadState();
  const admin = state.profiles.find((p) => p.id === adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Sécurité : seul un administrateur peut réinitialiser le mot de passe d’un compte.');
  }
  if (newPassword.length < 8) {
    throw new Error('Le nouveau mot de passe doit comporter au moins 8 caractères.');
  }
  const target = state.profiles.find((p) => p.id === targetUserId);
  if (!target) {
    throw new Error('Utilisateur cible introuvable.');
  }

  try {
    await withTimeout(
      supabase.rpc('admin_reset_user_password', {
        p_user_id: targetUserId,
        p_new_password: newPassword,
      }),
      2500
    );
  } catch {

  }

  state.passwords[target.email.toLowerCase()] = digestPassword(newPassword);
  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: adminId,
    action_type: 'ADMIN_PASSWORD_RESET',
    entity_type: 'profile',
    entity_id: targetUserId,
    details: { email: target.email, full_name: target.full_name },
    created_at: new Date().toISOString(),
  });
  saveState(state);
}

export async function updateUserProfile(
  actorId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const state = loadState();
  const idx = state.profiles.findIndex((p) => p.id === actorId);
  if (idx < 0) throw new Error('Profil introuvable.');

  const current = state.profiles[idx];

  
  if (updates.role && updates.role !== current.role && current.role !== 'admin') {
    throw new Error('Sécurité : vous ne pouvez pas modifier votre rôle utilisateur.');
  }

  const updated: Profile = {
    ...current,
    full_name: updates.full_name !== undefined ? sanitizeText(updates.full_name) : current.full_name,
    phone: updates.phone !== undefined ? (updates.phone ? sanitizeText(updates.phone) : null) : current.phone,
    bio: updates.bio !== undefined ? (updates.bio ? sanitizeText(updates.bio) : null) : current.bio,
    university_or_school:
      updates.university_or_school !== undefined
        ? updates.university_or_school
          ? sanitizeText(updates.university_or_school)
          : null
        : current.university_or_school,
    study_city:
      updates.study_city !== undefined
        ? updates.study_city
          ? sanitizeText(updates.study_city)
          : null
        : current.study_city,
    max_budget: updates.max_budget !== undefined ? updates.max_budget : current.max_budget,
    guarantor_type: updates.guarantor_type !== undefined ? updates.guarantor_type : current.guarantor_type,
    company_name:
      updates.company_name !== undefined
        ? updates.company_name
          ? sanitizeText(updates.company_name)
          : null
        : current.company_name,
    siret:
      updates.siret !== undefined ? (updates.siret ? sanitizeText(updates.siret) : null) : current.siret,
    professional_card:
      updates.professional_card !== undefined
        ? updates.professional_card
          ? sanitizeText(updates.professional_card)
          : null
        : current.professional_card,
    notification_prefs: updates.notification_prefs || current.notification_prefs,
    updated_at: new Date().toISOString(),
  };

  try {
    await withTimeout(
      supabase
        .from('profiles')
        .update({
          full_name: updated.full_name,
          phone: updated.phone,
          bio: updated.bio,
          university_or_school: updated.university_or_school,
          study_city: updated.study_city,
          max_budget: updated.max_budget,
          guarantor_type: updated.guarantor_type,
          company_name: updated.company_name,
          siret: updated.siret,
          professional_card: updated.professional_card,
          notification_prefs: updated.notification_prefs,
        })
        .eq('id', actorId),
      2000
    );
  } catch {

  }

  state.profiles[idx] = updated;
  saveState(state);
  return updated;
}

export async function requestAccountDeletion(userId: string, reason: string): Promise<Profile> {
  const state = loadState();
  const idx = state.profiles.findIndex((p) => p.id === userId);
  if (idx < 0) throw new Error('Compte introuvable.');

  const now = new Date().toISOString();
  state.profiles[idx] = {
    ...state.profiles[idx],
    status: 'deletion_requested',
    deletion_requested_at: now,
    deletion_reason: sanitizeText(reason),
    updated_at: now,
  };

  try {
    await withTimeout(
      supabase
        .from('profiles')
        .update({
          status: 'deletion_requested',
          deletion_requested_at: now,
          deletion_reason: sanitizeText(reason),
        })
        .eq('id', userId),
      2000
    );
  } catch {

  }

  saveState(state);
  return state.profiles[idx];
}

export function searchPublishedProperties(filters: SearchFilters = {}): {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const state = loadState();
  
  let list = state.properties
    .filter((p) => p.status === 'published')
    .map((p) => hydrateProperty(p, state));

  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.city_name.toLowerCase().includes(q) ||
        p.postal_code.toLowerCase().includes(q) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
        p.nearby_schools.some((s) => s.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters.city && filters.city.trim()) {
    const c = filters.city.trim().toLowerCase();
    list = list.filter((p) => p.city_name.toLowerCase() === c);
  }

  if (filters.postalCode && filters.postalCode.trim()) {
    const pc = filters.postalCode.trim();
    list = list.filter((p) => p.postal_code.startsWith(pc));
  }

  if (filters.neighborhood && filters.neighborhood.trim()) {
    const nb = filters.neighborhood.trim().toLowerCase();
    list = list.filter((p) => p.neighborhood?.toLowerCase().includes(nb));
  }

  if (filters.school && filters.school.trim()) {
    const sc = filters.school.trim().toLowerCase();
    list = list.filter((p) => p.nearby_schools.some((s) => s.toLowerCase().includes(sc)));
  }

  if (filters.propertyType) {
    list = list.filter((p) => p.property_type === filters.propertyType);
  }

  if (filters.minBudget !== undefined && filters.minBudget !== '') {
    list = list.filter((p) => p.rent_including_charges >= Number(filters.minBudget));
  }

  if (filters.maxBudget !== undefined && filters.maxBudget !== '') {
    list = list.filter((p) => p.rent_including_charges <= Number(filters.maxBudget));
  }

  if (filters.minSurface !== undefined && filters.minSurface !== '') {
    list = list.filter((p) => p.surface_m2 >= Number(filters.minSurface));
  }

  if (filters.maxSurface !== undefined && filters.maxSurface !== '') {
    list = list.filter((p) => p.surface_m2 <= Number(filters.maxSurface));
  }

  if (filters.furnished === 'true') {
    list = list.filter((p) => p.furnished === true);
  } else if (filters.furnished === 'false') {
    list = list.filter((p) => p.furnished === false);
  }

  if (filters.availableFrom && filters.availableFrom.trim()) {
    list = list.filter((p) => p.available_from <= filters.availableFrom!);
  }

  if (filters.eligibleApl) {
    list = list.filter((p) => p.eligible_apl === true);
  }

  if (filters.acceptsVisale) {
    list = list.filter((p) => p.accepts_visale === true);
  }

  if (filters.amenities && filters.amenities.length > 0) {
    list = list.filter((p) =>
      filters.amenities!.every((reqAmenity) => (p.amenities || []).includes(reqAmenity))
    );
  }

  
  const sortBy = filters.sortBy || 'relevance';
  if (sortBy === 'price_asc') {
    list.sort((a, b) => a.rent_including_charges - b.rent_including_charges);
  } else if (sortBy === 'price_desc') {
    list.sort((a, b) => b.rent_including_charges - a.rent_including_charges);
  } else if (sortBy === 'date_desc') {
    list.sort(
      (a, b) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime()
    );
  } else {
    
    list.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return b.views_count - a.views_count;
    });
  }

  const page = Math.max(1, filters.page || 1);
  const pageSize = filters.pageSize || 6;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}

export function getPropertyBySlug(slug: string, viewer?: Profile | null): Property | null {
  const state = loadState();
  const found = state.properties.find((p) => p.slug === slug || p.id === slug);
  if (!found) return null;

  
  if (found.status !== 'published') {
    if (!viewer) return null;
    if (viewer.role !== 'admin' && viewer.id !== found.owner_id) {
      return null;
    }
  }

  return hydrateProperty(found, state);
}

export function getSimilarProperties(property: Property, limit = 3): Property[] {
  const state = loadState();
  return state.properties
    .filter(
      (p) =>
        p.status === 'published' &&
        p.id !== property.id &&
        (p.city_name === property.city_name || p.property_type === property.property_type)
    )
    .slice(0, limit)
    .map((p) => hydrateProperty(p, state));
}

export function getAdvertiserProperties(ownerId: string): Property[] {
  const state = loadState();
  return state.properties
    .filter((p) => p.owner_id === ownerId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((p) => hydrateProperty(p, state));
}

export function getAllPropertiesForAdmin(): Property[] {
  const state = loadState();
  return state.properties
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((p) => hydrateProperty(p, state));
}

export async function createOrUpdateProperty(
  actor: Profile,
  payload: Partial<Property> & {
    title: string;
    property_type: Property['property_type'];
    city_name: string;
    postal_code: string;
    address_public: string;
    surface_m2: number;
    rent_excluding_charges: number;
    charges_amount: number;
    description: string;
    amenities: string[];
    imageUrls: string[];
  },
  targetStatus: 'draft' | 'pending'
): Promise<Property> {
  if (!canUserPublishProperty(actor.role)) {
    throw new Error(
      'Règle fondamentale ErikaLog : un compte étudiant ne peut jamais publier une annonce immobilière.'
    );
  }

  const state = loadState();
  const now = new Date().toISOString();
  const cityObj = state.cities.find(
    (c) => c.name.toLowerCase() === payload.city_name.trim().toLowerCase()
  );

  
  if (!payload.id) {
    const duplicate = state.properties.find(
      (p) =>
        p.owner_id === actor.id &&
        p.title.trim().toLowerCase() === payload.title.trim().toLowerCase() &&
        p.postal_code === payload.postal_code.trim() &&
        p.status !== 'archived'
    );
    if (duplicate) {
      throw new Error(
        'Contrôle anti-doublon : vous avez déjà une annonce active portant exactement ce titre dans ce code postal.'
      );
    }
  }

  if (payload.id) {
    const existingIdx = state.properties.findIndex((p) => p.id === payload.id);
    if (existingIdx < 0) throw new Error('Annonce introuvable.');
    const existing = state.properties[existingIdx];

    if (!canUserModifyProperty(actor.id, actor.role, existing.owner_id)) {
      throw new Error('Sécurité : vous ne pouvez modifier que vos propres annonces.');
    }

    let computedStatus: PropertyStatus = targetStatus;
    if (
      existing.status === 'published' &&
      state.siteSettings.revalidate_on_sensitive_edit &&
      actor.role !== 'admin' &&
      isSensitivePropertyChange(existing, {
        title: payload.title,
        rent_excluding_charges: payload.rent_excluding_charges,
        charges_amount: payload.charges_amount,
        city_name: payload.city_name,
        address_public: payload.address_public,
      })
    ) {
      computedStatus = 'pending';
      state.moderationLogs.unshift({
        id: crypto.randomUUID(),
        property_id: existing.id,
        moderator_id: actor.id,
        previous_status: 'published',
        new_status: 'pending',
        reason:
          'Modification de champs sensibles (titre, loyer ou localisation) : passage automatique en revalidation.',
        created_at: now,
      });
    }

    const images = payload.imageUrls.map((url, idx) => ({
      id: `img-${existing.id}-${idx + 1}`,
      property_id: existing.id,
      url,
      alt_text: `${payload.title} - Photo ${idx + 1}`,
      display_order: idx + 1,
      is_primary: idx === 0,
    }));

    const updated: Property = {
      ...existing,
      title: sanitizeText(payload.title),
      property_type: payload.property_type,
      status: computedStatus,
      city_id: cityObj?.id || existing.city_id,
      city_name: sanitizeText(payload.city_name),
      postal_code: sanitizeText(payload.postal_code),
      neighborhood: payload.neighborhood ? sanitizeText(payload.neighborhood) : existing.neighborhood,
      address_public: sanitizeText(payload.address_public),
      address_private: payload.address_private ? sanitizeText(payload.address_private) : existing.address_private,
      nearby_schools: payload.nearby_schools || existing.nearby_schools,
      surface_m2: Number(payload.surface_m2),
      rooms_count: Number(payload.rooms_count || 1),
      bedrooms_count: Number(payload.bedrooms_count ?? 1),
      bathrooms_count: Number(payload.bathrooms_count || 1),
      floor_number: payload.floor_number ?? existing.floor_number,
      has_elevator: Boolean(payload.has_elevator),
      furnished: payload.furnished ?? true,
      dpe_rating: payload.dpe_rating || existing.dpe_rating,
      ges_rating: payload.ges_rating || existing.ges_rating,
      rent_excluding_charges: Number(payload.rent_excluding_charges),
      charges_amount: Number(payload.charges_amount),
      rent_including_charges:
        Number(payload.rent_excluding_charges) + Number(payload.charges_amount),
      charges_type: payload.charges_type || existing.charges_type,
      security_deposit: Number(payload.security_deposit ?? payload.rent_excluding_charges),
      agency_fees: Number(payload.agency_fees ?? 0),
      available_from: payload.available_from || existing.available_from,
      min_lease_months: Number(payload.min_lease_months || 9),
      lease_type: payload.lease_type || existing.lease_type,
      eligible_apl: payload.eligible_apl ?? true,
      accepts_visale: payload.accepts_visale ?? true,
      guarantor_required: payload.guarantor_required ?? true,
      smoking_allowed: Boolean(payload.smoking_allowed),
      pets_allowed: Boolean(payload.pets_allowed),
      colocation_friendly: Boolean(payload.colocation_friendly),
      description: sanitizeText(payload.description),
      rental_conditions: payload.rental_conditions ? sanitizeText(payload.rental_conditions) : existing.rental_conditions,
      cover_image_url: payload.imageUrls[0] || existing.cover_image_url,
      submitted_at: computedStatus === 'pending' ? now : existing.submitted_at,
      updated_at: now,
      amenities: payload.amenities,
      images,
    };

    try {
      await withTimeout(
        supabase
          .from('properties')
          .update({
            title: updated.title,
            property_type: updated.property_type,
            status: updated.status,
            city_name: updated.city_name,
            postal_code: updated.postal_code,
            neighborhood: updated.neighborhood,
            address_public: updated.address_public,
            surface_m2: updated.surface_m2,
            rent_excluding_charges: updated.rent_excluding_charges,
            charges_amount: updated.charges_amount,
            description: updated.description,
            rental_conditions: updated.rental_conditions,
            cover_image_url: updated.cover_image_url,
          })
          .eq('id', existing.id),
        2500
      );
    } catch {

    }

    state.properties[existingIdx] = updated;
    saveState(state);
    return hydrateProperty(updated, state);
  }

  
  const newId = crypto.randomUUID();
  const slugBase = payload.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${slugBase}-${newId.slice(0, 6)}`;
  const refNum = String(state.properties.length + 1).padStart(3, '0');
  const reference = `ERK-2026-${refNum}`;

  const finalStatus: PropertyStatus =
    targetStatus === 'pending'
      ? state.siteSettings.require_moderation_before_publish && actor.role !== 'admin'
        ? 'pending'
        : 'published'
      : 'draft';

  const images = payload.imageUrls.map((url, idx) => ({
    id: `img-${newId}-${idx + 1}`,
    property_id: newId,
    url,
    alt_text: `${payload.title} - Photo ${idx + 1}`,
    display_order: idx + 1,
    is_primary: idx === 0,
  }));

  const created: Property = {
    id: newId,
    slug,
    reference,
    owner_id: actor.id,
    organization_id: actor.organization_id,
    title: sanitizeText(payload.title),
    property_type: payload.property_type,
    status: finalStatus,
    rejection_reason: null,
    city_id: cityObj?.id || null,
    city_name: sanitizeText(payload.city_name),
    postal_code: sanitizeText(payload.postal_code),
    neighborhood: payload.neighborhood ? sanitizeText(payload.neighborhood) : null,
    address_public: sanitizeText(payload.address_public),
    address_private: payload.address_private ? sanitizeText(payload.address_private) : null,
    nearby_schools: payload.nearby_schools || [],
    latitude: null,
    longitude: null,
    surface_m2: Number(payload.surface_m2),
    rooms_count: Number(payload.rooms_count || 1),
    bedrooms_count: Number(payload.bedrooms_count ?? 1),
    bathrooms_count: Number(payload.bathrooms_count || 1),
    floor_number: payload.floor_number ?? 1,
    has_elevator: Boolean(payload.has_elevator),
    furnished: payload.furnished ?? true,
    dpe_rating: payload.dpe_rating || 'C',
    ges_rating: payload.ges_rating || 'B',
    rent_excluding_charges: Number(payload.rent_excluding_charges),
    charges_amount: Number(payload.charges_amount),
    rent_including_charges:
      Number(payload.rent_excluding_charges) + Number(payload.charges_amount),
    charges_type: payload.charges_type || 'forfait',
    security_deposit: Number(payload.security_deposit ?? payload.rent_excluding_charges),
    agency_fees: Number(payload.agency_fees ?? 0),
    available_from: payload.available_from || '2026-09-01',
    min_lease_months: Number(payload.min_lease_months || 9),
    lease_type: payload.lease_type || 'Bail étudiant 9 mois ou meublé 12 mois',
    eligible_apl: payload.eligible_apl ?? true,
    accepts_visale: payload.accepts_visale ?? true,
    guarantor_required: payload.guarantor_required ?? true,
    smoking_allowed: Boolean(payload.smoking_allowed),
    pets_allowed: Boolean(payload.pets_allowed),
    colocation_friendly: Boolean(payload.colocation_friendly),
    description: sanitizeText(payload.description),
    rental_conditions: payload.rental_conditions ? sanitizeText(payload.rental_conditions) : null,
    cover_image_url: payload.imageUrls[0] || null,
    views_count: 0,
    is_demo: false,
    is_featured: false,
    submitted_at: finalStatus === 'pending' ? now : null,
    published_at: finalStatus === 'published' ? now : null,
    moderated_by: null,
    moderated_at: null,
    created_at: now,
    updated_at: now,
    amenities: payload.amenities,
    images,
  };

  try {
    await withTimeout(
      supabase.from('properties').insert({
        id: created.id,
        slug: created.slug,
        reference: created.reference,
        owner_id: created.owner_id,
        organization_id: created.organization_id,
        title: created.title,
        property_type: created.property_type,
        status: created.status,
        city_id: created.city_id,
        city_name: created.city_name,
        postal_code: created.postal_code,
        neighborhood: created.neighborhood,
        address_public: created.address_public,
        address_private: created.address_private,
        nearby_schools: created.nearby_schools,
        surface_m2: created.surface_m2,
        rooms_count: created.rooms_count,
        bedrooms_count: created.bedrooms_count,
        bathrooms_count: created.bathrooms_count,
        floor_number: created.floor_number,
        has_elevator: created.has_elevator,
        furnished: created.furnished,
        dpe_rating: created.dpe_rating,
        ges_rating: created.ges_rating,
        rent_excluding_charges: created.rent_excluding_charges,
        charges_amount: created.charges_amount,
        charges_type: created.charges_type,
        security_deposit: created.security_deposit,
        agency_fees: created.agency_fees,
        available_from: created.available_from,
        min_lease_months: created.min_lease_months,
        lease_type: created.lease_type,
        eligible_apl: created.eligible_apl,
        accepts_visale: created.accepts_visale,
        guarantor_required: created.guarantor_required,
        description: created.description,
        rental_conditions: created.rental_conditions,
        cover_image_url: created.cover_image_url,
        is_demo: false,
      }),
      2500
    );
  } catch {

  }

  state.properties.unshift(created);
  saveState(state);
  return hydrateProperty(created, state);
}

export async function updatePropertyStatusByOwner(
  actor: Profile,
  propertyId: string,
  nextStatus: PropertyStatus
): Promise<Property> {
  const state = loadState();
  const idx = state.properties.findIndex((p) => p.id === propertyId);
  if (idx < 0) throw new Error('Annonce introuvable.');
  const prop = state.properties[idx];

  if (!canUserModifyProperty(actor.id, actor.role, prop.owner_id)) {
    throw new Error('Sécurité : vous ne pouvez gérer que vos propres annonces.');
  }

  if (!canTransitionPropertyStatus(prop.status, nextStatus, actor.role)) {
    throw new Error(
      `Transition de statut non autorisée (${prop.status} -> ${nextStatus}) pour votre rôle.`
    );
  }

  const now = new Date().toISOString();
  state.properties[idx] = {
    ...prop,
    status: nextStatus,
    submitted_at: nextStatus === 'pending' ? now : prop.submitted_at,
    updated_at: now,
  };

  try {
    await withTimeout(
      supabase.from('properties').update({ status: nextStatus, updated_at: now }).eq('id', propertyId),
      2000
    );
  } catch {

  }

  saveState(state);
  return hydrateProperty(state.properties[idx], state);
}

export async function adminModerateProperty(
  admin: Profile,
  propertyId: string,
  nextStatus: PropertyStatus,
  reason?: string
): Promise<Property> {
  if (admin.role !== 'admin') {
    throw new Error('Sécurité : privilèges administrateur requis pour modérer une annonce.');
  }
  const state = loadState();
  const idx = state.properties.findIndex((p) => p.id === propertyId);
  if (idx < 0) throw new Error('Annonce introuvable.');

  const prev = state.properties[idx];
  const now = new Date().toISOString();

  try {
    await withTimeout(
      supabase.rpc('admin_moderate_property', {
        p_property_id: propertyId,
        p_new_status: nextStatus,
        p_reason: reason || null,
      }),
      2500
    );
  } catch {

  }

  state.properties[idx] = {
    ...prev,
    status: nextStatus,
    rejection_reason:
      nextStatus === 'rejected' || nextStatus === 'suspended' ? reason || 'Non précisé' : null,
    published_at: nextStatus === 'published' ? prev.published_at || now : prev.published_at,
    moderated_by: admin.id,
    moderated_at: now,
    updated_at: now,
  };

  state.moderationLogs.unshift({
    id: crypto.randomUUID(),
    property_id: propertyId,
    moderator_id: admin.id,
    previous_status: prev.status,
    new_status: nextStatus,
    reason: reason || null,
    created_at: now,
  });

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: `MODERATE_PROPERTY_${nextStatus.toUpperCase()}`,
    entity_type: 'property',
    entity_id: propertyId,
    details: { title: prev.title, previous_status: prev.status, new_status: nextStatus, reason },
    created_at: now,
  });

  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: prev.owner_id,
    type: 'moderation_decision',
    title:
      nextStatus === 'published'
        ? 'Votre annonce est publiée !'
        : nextStatus === 'rejected'
        ? 'Votre annonce nécessite des modifications'
        : `Statut de votre annonce : ${nextStatus}`,
    message: `Logement "${prev.title}" — ${reason || 'Décision de modération appliquée.'}`,
    link_url: '/annonceur',
    is_read: false,
    email_dispatched: true,
    created_at: now,
  });

  saveState(state);
  return hydrateProperty(state.properties[idx], state);
}

export function getUserFavorites(userId: string): Favorite[] {
  const state = loadState();
  return state.favorites
    .filter((f) => f.user_id === userId)
    .map((f) => {
      const prop = state.properties.find((p) => p.id === f.property_id);
      return {
        ...f,
        property: prop ? hydrateProperty(prop, state) : undefined,
      };
    })
    .filter((f) => Boolean(f.property));
}

export function isPropertyFavorited(userId: string | undefined, propertyId: string): boolean {
  if (!userId) return false;
  const state = loadState();
  return state.favorites.some((f) => f.user_id === userId && f.property_id === propertyId);
}

export async function toggleFavoriteProperty(
  userId: string,
  propertyId: string
): Promise<{ favorited: boolean }> {
  const state = loadState();
  const existingIdx = state.favorites.findIndex(
    (f) => f.user_id === userId && f.property_id === propertyId
  );

  if (existingIdx >= 0) {
    state.favorites.splice(existingIdx, 1);
    saveState(state);
    try {
      await withTimeout(
        supabase.from('favorites').delete().eq('user_id', userId).eq('property_id', propertyId),
        2000
      );
    } catch {

    }
    return { favorited: false };
  }

  const fav: Favorite = {
    id: crypto.randomUUID(),
    user_id: userId,
    property_id: propertyId,
    created_at: new Date().toISOString(),
  };
  state.favorites.unshift(fav);
  saveState(state);
  try {
    await withTimeout(
      supabase.from('favorites').insert({ user_id: userId, property_id: propertyId }),
      2000
    );
  } catch {

  }
  return { favorited: true };
}

export function getUserSavedSearches(userId: string): SavedSearch[] {
  const state = loadState();
  return state.savedSearches.filter((s) => s.user_id === userId);
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: SearchFilters
): Promise<SavedSearch> {
  const state = loadState();
  const item: SavedSearch = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: sanitizeText(name),
    filters,
    email_alerts: true,
    created_at: new Date().toISOString(),
  };
  state.savedSearches.unshift(item);
  saveState(state);
  try {
    await withTimeout(
      supabase.from('saved_searches').insert({
        user_id: userId,
        name: item.name,
        filters: item.filters,
        email_alerts: true,
      }),
      2000
    );
  } catch {

  }
  return item;
}

export async function deleteSavedSearch(userId: string, searchId: string): Promise<void> {
  const state = loadState();
  state.savedSearches = state.savedSearches.filter(
    (s) => !(s.id === searchId && s.user_id === userId)
  );
  saveState(state);
  try {
    await withTimeout(
      supabase.from('saved_searches').delete().eq('id', searchId).eq('user_id', userId),
      2000
    );
  } catch {

  }
}

export function getUserConversations(actor: Profile): Conversation[] {
  const state = loadState();
  return state.conversations
    .filter((c) => canUserAccessConversation(actor.id, actor.role, c))
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    .map((c) => {
      const prop = state.properties.find((p) => p.id === c.property_id);
      const student = state.profiles.find((p) => p.id === c.student_id);
      const advertiser = state.profiles.find((p) => p.id === c.advertiser_id);
      const unreadCount = state.messages.filter(
        (m) => m.conversation_id === c.id && m.sender_id !== actor.id && !m.is_read
      ).length;
      return {
        ...c,
        property: prop ? hydrateProperty(prop, state) : undefined,
        student,
        advertiser,
        unread_count: unreadCount,
      };
    });
}

export function getConversationMessages(actor: Profile, conversationId: string): Message[] {
  const state = loadState();
  const conv = state.conversations.find((c) => c.id === conversationId);
  if (!conv) throw new Error('Conversation introuvable.');

  if (!canUserAccessConversation(actor.id, actor.role, conv)) {
    throw new Error('Sécurité : vous n’êtes pas autorisé à lire cette conversation privée.');
  }

  
  let changed = false;
  const now = new Date().toISOString();
  state.messages.forEach((m) => {
    if (m.conversation_id === conversationId && m.sender_id !== actor.id && !m.is_read) {
      m.is_read = true;
      m.read_at = now;
      changed = true;
    }
  });
  if (changed) saveState(state);

  return state.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => ({
      ...m,
      sender: state.profiles.find((p) => p.id === m.sender_id),
    }));
}

export async function startOrGetConversation(
  student: Profile,
  propertyId: string,
  initialMessage: string
): Promise<{ conversation: Conversation; message: Message }> {
  const state = loadState();
  if (!state.siteSettings.enable_private_messaging) {
    throw new Error('La messagerie privée est temporairement désactivée.');
  }

  const prop = state.properties.find((p) => p.id === propertyId);
  if (!prop) throw new Error('Logement introuvable.');
  if (prop.owner_id === student.id) {
    throw new Error('Vous êtes l’annonceur de ce logement.');
  }

  let conv = state.conversations.find(
    (c) =>
      c.property_id === propertyId &&
      c.student_id === student.id &&
      c.advertiser_id === prop.owner_id
  );

  const now = new Date().toISOString();
  const cleanMsg = sanitizeText(initialMessage);
  if (cleanMsg.length < 2) {
    throw new Error('Veuillez saisir un message valide.');
  }

  if (!conv) {
    conv = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      student_id: student.id,
      advertiser_id: prop.owner_id,
      subject: `Contact — ${prop.title}`,
      status: 'active',
      last_message_at: now,
      last_message_preview: cleanMsg.slice(0, 140),
      created_at: now,
    };
    state.conversations.unshift(conv);

    try {
      await withTimeout(
        supabase.from('conversations').insert({
          id: conv.id,
          property_id: conv.property_id,
          student_id: conv.student_id,
          advertiser_id: conv.advertiser_id,
          subject: conv.subject,
        }),
        2000
      );
    } catch {

    }
  }

  const msg = await sendMessageInConversation(student, conv.id, cleanMsg);
  return { conversation: conv, message: msg };
}

export async function sendMessageInConversation(
  sender: Profile,
  conversationId: string,
  content: string
): Promise<Message> {
  const state = loadState();
  const convIdx = state.conversations.findIndex((c) => c.id === conversationId);
  if (convIdx < 0) throw new Error('Conversation introuvable.');
  const conv = state.conversations[convIdx];

  if (sender.id !== conv.student_id && sender.id !== conv.advertiser_id) {
    throw new Error('Sécurité : vous ne participez pas à cette conversation.');
  }
  if (conv.status === 'blocked') {
    throw new Error('Cette conversation a été bloquée par la modération.');
  }

  const clean = sanitizeText(content);
  if (!clean) throw new Error('Le message ne peut pas être vide.');

  const now = new Date().toISOString();
  const newMsg: Message = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    sender_id: sender.id,
    content: clean,
    is_read: false,
    read_at: null,
    created_at: now,
    sender,
  };

  state.messages.push(newMsg);
  state.conversations[convIdx] = {
    ...conv,
    last_message_at: now,
    last_message_preview: clean.slice(0, 140),
  };

  const recipientId = sender.id === conv.student_id ? conv.advertiser_id : conv.student_id;
  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: recipientId,
    type: 'new_message',
    title: `Nouveau message de ${sender.full_name}`,
    message: clean.slice(0, 120),
    link_url: `/messagerie?conversation=${conversationId}`,
    is_read: false,
    email_dispatched: true,
    created_at: now,
  });

  saveState(state);

  try {
    await withTimeout(
      supabase.from('messages').insert({
        id: newMsg.id,
        conversation_id: conversationId,
        sender_id: sender.id,
        content: clean,
      }),
      2000
    );
  } catch {

  }

  return newMsg;
}

export function getViewingRequestsForUser(actor: Profile): ViewingRequest[] {
  const state = loadState();
  const filtered = state.viewingRequests.filter((vr) => {
    if (actor.role === 'admin') return true;
    return vr.student_id === actor.id || vr.advertiser_id === actor.id;
  });

  return filtered
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((vr) => {
      const prop = state.properties.find((p) => p.id === vr.property_id);
      return {
        ...vr,
        property: prop ? hydrateProperty(prop, state) : undefined,
        student: state.profiles.find((p) => p.id === vr.student_id),
        advertiser: state.profiles.find((p) => p.id === vr.advertiser_id),
      };
    });
}

export async function createViewingRequest(
  student: Profile,
  input: {
    property_id: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    preferred_date: string;
    preferred_time_slot: string;
    visit_mode: 'in_person' | 'video';
    student_message?: string;
    privacy_consent: boolean;
  }
): Promise<ViewingRequest> {
  const state = loadState();
  if (!state.siteSettings.enable_visit_requests) {
    throw new Error('Les demandes de visite sont temporairement désactivées.');
  }
  if (!input.privacy_consent) {
    throw new Error('Veuillez accepter la politique de confidentialité pour transmettre votre demande.');
  }

  const prop = state.properties.find((p) => p.id === input.property_id);
  if (!prop || prop.status !== 'published') {
    throw new Error('Ce logement n’est pas disponible aux visites.');
  }

  const now = new Date().toISOString();
  const vr: ViewingRequest = {
    id: crypto.randomUUID(),
    property_id: prop.id,
    student_id: student.id,
    advertiser_id: prop.owner_id,
    applicant_name: sanitizeText(input.applicant_name),
    applicant_email: input.applicant_email.trim(),
    applicant_phone: sanitizeText(input.applicant_phone),
    preferred_date: input.preferred_date,
    preferred_time_slot: input.preferred_time_slot,
    visit_mode: input.visit_mode,
    student_message: input.student_message ? sanitizeText(input.student_message) : null,
    privacy_consent: true,
    status: 'pending',
    proposed_date: null,
    proposed_time_slot: null,
    advertiser_response: null,
    responded_at: null,
    created_at: now,
    updated_at: now,
  };

  state.viewingRequests.unshift(vr);
  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: prop.owner_id,
    type: 'viewing_request',
    title: `Nouvelle demande de visite — ${vr.applicant_name}`,
    message: `Pour "${prop.title}" le ${vr.preferred_date} (${vr.preferred_time_slot}).`,
    link_url: '/annonceur',
    is_read: false,
    email_dispatched: true,
    created_at: now,
  });

  saveState(state);

  try {
    await withTimeout(
      supabase.from('viewing_requests').insert({
        id: vr.id,
        property_id: vr.property_id,
        student_id: vr.student_id,
        advertiser_id: vr.advertiser_id,
        applicant_name: vr.applicant_name,
        applicant_email: vr.applicant_email,
        applicant_phone: vr.applicant_phone,
        preferred_date: vr.preferred_date,
        preferred_time_slot: vr.preferred_time_slot,
        visit_mode: vr.visit_mode,
        student_message: vr.student_message,
        privacy_consent: true,
      }),
      2000
    );
  } catch {

  }

  return {
    ...vr,
    property: hydrateProperty(prop, state),
    student,
    advertiser: state.profiles.find((p) => p.id === prop.owner_id),
  };
}

export async function updateViewingRequestStatus(
  actor: Profile,
  requestId: string,
  nextStatus: ViewingStatus,
  options?: {
    proposed_date?: string;
    proposed_time_slot?: string;
    advertiser_response?: string;
  }
): Promise<ViewingRequest> {
  const state = loadState();
  const idx = state.viewingRequests.findIndex((v) => v.id === requestId);
  if (idx < 0) throw new Error('Demande de visite introuvable.');
  const vr = state.viewingRequests[idx];

  if (
    actor.role !== 'admin' &&
    actor.id !== vr.advertiser_id &&
    actor.id !== vr.student_id
  ) {
    throw new Error('Sécurité : vous n’êtes pas autorisé à modifier cette demande de visite.');
  }

  const now = new Date().toISOString();
  const updated: ViewingRequest = {
    ...vr,
    status: nextStatus,
    proposed_date: options?.proposed_date ?? vr.proposed_date,
    proposed_time_slot: options?.proposed_time_slot ?? vr.proposed_time_slot,
    advertiser_response:
      options?.advertiser_response !== undefined
        ? sanitizeText(options.advertiser_response)
        : vr.advertiser_response,
    responded_at: now,
    updated_at: now,
  };

  state.viewingRequests[idx] = updated;

  const prop = state.properties.find((p) => p.id === vr.property_id);
  const targetNotifyId = actor.id === vr.advertiser_id ? vr.student_id : vr.advertiser_id;
  state.notifications.unshift({
    id: crypto.randomUUID(),
    user_id: targetNotifyId,
    type: 'viewing_response',
    title:
      nextStatus === 'accepted'
        ? 'Demande de visite confirmée !'
        : nextStatus === 'alternative_proposed'
        ? 'Nouveau créneau de visite proposé'
        : nextStatus === 'declined'
        ? 'Demande de visite déclinée'
        : 'Mise à jour de votre demande de visite',
    message: `Logement "${prop?.title || ''}" — ${updated.advertiser_response || nextStatus}`,
    link_url: targetNotifyId === vr.student_id ? '/etudiant' : '/annonceur',
    is_read: false,
    email_dispatched: true,
    created_at: now,
  });

  saveState(state);

  try {
    await withTimeout(
      supabase
        .from('viewing_requests')
        .update({
          status: updated.status,
          proposed_date: updated.proposed_date,
          proposed_time_slot: updated.proposed_time_slot,
          advertiser_response: updated.advertiser_response,
          responded_at: now,
          updated_at: now,
        })
        .eq('id', requestId),
      2000
    );
  } catch {

  }

  return updated;
}

export function getUserNotifications(userId: string): AppNotification[] {
  const state = loadState();
  return state.notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationRead(userId: string, notificationId?: string): Promise<void> {
  const state = loadState();
  state.notifications.forEach((n) => {
    if (n.user_id === userId && (!notificationId || n.id === notificationId)) {
      n.is_read = true;
    }
  });
  saveState(state);
  try {
    if (notificationId) {
      await withTimeout(
        supabase.from('notifications').update({ is_read: true }).eq('id', notificationId),
        1500
      );
    } else {
      await withTimeout(
        supabase.from('notifications').update({ is_read: true }).eq('user_id', userId),
        1500
      );
    }
  } catch {

  }
}

export async function createSafetyReport(
  reporter: Profile,
  input: {
    target_type: 'property' | 'user' | 'conversation';
    target_property_id?: string | null;
    target_user_id?: string | null;
    target_conversation_id?: string | null;
    reason_category: string;
    description: string;
  }
): Promise<Report> {
  const state = loadState();
  const now = new Date().toISOString();
  const rep: Report = {
    id: crypto.randomUUID(),
    reporter_id: reporter.id,
    target_type: input.target_type,
    target_property_id: input.target_property_id || null,
    target_user_id: input.target_user_id || null,
    target_conversation_id: input.target_conversation_id || null,
    reason_category: sanitizeText(input.reason_category),
    description: sanitizeText(input.description),
    status: 'open',
    admin_decision: null,
    action_taken: null,
    resolved_by: null,
    resolved_at: null,
    created_at: now,
  };

  if (input.target_conversation_id) {
    const conv = state.conversations.find((c) => c.id === input.target_conversation_id);
    if (conv) conv.status = 'reported';
  }

  state.reports.unshift(rep);
  saveState(state);

  try {
    await withTimeout(
      supabase.from('reports').insert({
        id: rep.id,
        reporter_id: rep.reporter_id,
        target_type: rep.target_type,
        target_property_id: rep.target_property_id,
        target_user_id: rep.target_user_id,
        target_conversation_id: rep.target_conversation_id,
        reason_category: rep.reason_category,
        description: rep.description,
      }),
      2000
    );
  } catch {

  }

  return rep;
}

export function getAdminDashboardData(admin: Profile) {
  if (admin.role !== 'admin') {
    throw new Error('Sécurité : accès réservé aux administrateurs ErikaLog.');
  }
  const state = loadState();
  return {
    profiles: state.profiles,
    properties: state.properties.map((p) => hydrateProperty(p, state)),
    reports: state.reports.map((r) => ({
      ...r,
      reporter: state.profiles.find((p) => p.id === r.reporter_id),
      target_property: state.properties.find((p) => p.id === r.target_property_id),
      target_user: state.profiles.find((p) => p.id === r.target_user_id),
    })),
    moderationLogs: state.moderationLogs,
    auditLogs: state.auditLogs,
    conversationsCount: state.conversations.length,
    viewingRequests: state.viewingRequests.map((vr) => ({
      ...vr,
      property: state.properties.find((p) => p.id === vr.property_id),
      student: state.profiles.find((p) => p.id === vr.student_id),
      advertiser: state.profiles.find((p) => p.id === vr.advertiser_id),
    })),
    cities: state.cities,
    amenities: state.amenities,
    cmsPages: state.cmsPages,
    cmsArticles: state.cmsArticles,
    faqs: state.faqs,
    siteSettings: state.siteSettings,
  };
}

export async function adminUpdateUserAccount(
  admin: Profile,
  targetUserId: string,
  updates: { role: UserRole; status: UserStatus; is_verified: boolean }
): Promise<Profile> {
  if (admin.role !== 'admin') {
    throw new Error('Sécurité : privilèges administrateur requis.');
  }
  const state = loadState();
  const idx = state.profiles.findIndex((p) => p.id === targetUserId);
  if (idx < 0) throw new Error('Utilisateur introuvable.');

  const prev = state.profiles[idx];
  const now = new Date().toISOString();

  try {
    await withTimeout(
      supabase.rpc('admin_update_user_account', {
        p_user_id: targetUserId,
        p_role: updates.role,
        p_status: updates.status,
        p_is_verified: updates.is_verified,
      }),
      2500
    );
  } catch {

  }

  state.profiles[idx] = {
    ...prev,
    role: updates.role,
    account_type:
      updates.role === 'admin'
        ? 'admin'
        : updates.role === 'owner'
        ? 'individual_owner'
        : updates.role === 'agent'
        ? 'real_estate_agent'
        : 'student',
    status: updates.status,
    is_verified: updates.is_verified,
    updated_at: now,
  };

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: 'UPDATE_USER_ACCOUNT',
    entity_type: 'profile',
    entity_id: targetUserId,
    details: {
      email: prev.email,
      old_role: prev.role,
      new_role: updates.role,
      old_status: prev.status,
      new_status: updates.status,
      is_verified: updates.is_verified,
    },
    created_at: now,
  });

  saveState(state);
  return state.profiles[idx];
}

export async function adminResolveReport(
  admin: Profile,
  reportId: string,
  input: {
    status: ReportStatus;
    decision: string;
    actionTaken: string;
    suspendProperty?: boolean;
    suspendUser?: boolean;
  }
): Promise<Report> {
  if (admin.role !== 'admin') {
    throw new Error('Sécurité : privilèges administrateur requis.');
  }
  const state = loadState();
  const idx = state.reports.findIndex((r) => r.id === reportId);
  if (idx < 0) throw new Error('Signalement introuvable.');

  const rep = state.reports[idx];
  const now = new Date().toISOString();

  try {
    await withTimeout(
      supabase.rpc('admin_resolve_report', {
        p_report_id: reportId,
        p_status: input.status,
        p_decision: input.decision,
        p_action_taken: input.actionTaken,
        p_suspend_property: Boolean(input.suspendProperty),
        p_suspend_user: Boolean(input.suspendUser),
      }),
      2500
    );
  } catch {

  }

  state.reports[idx] = {
    ...rep,
    status: input.status,
    admin_decision: sanitizeText(input.decision),
    action_taken: sanitizeText(input.actionTaken),
    resolved_by: admin.id,
    resolved_at: now,
  };

  if (input.suspendProperty && rep.target_property_id) {
    await adminModerateProperty(
      admin,
      rep.target_property_id,
      'suspended',
      `Suite au signalement #${reportId.slice(0, 8)} : ${input.decision}`
    );
  }

  if (input.suspendUser && rep.target_user_id) {
    const uIdx = state.profiles.findIndex((p) => p.id === rep.target_user_id);
    if (uIdx >= 0) state.profiles[uIdx].status = 'suspended';
  }

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: 'RESOLVE_REPORT',
    entity_type: 'report',
    entity_id: reportId,
    details: input,
    created_at: now,
  });

  saveState(state);
  return state.reports[idx];
}

export function getPublicReferenceData() {
  const state = loadState();
  return {
    cities: [...state.cities].sort((a, b) => a.display_order - b.display_order),
    amenities: state.amenities.filter((a) => a.is_active),
    siteSettings: state.siteSettings,
    faqs: state.faqs
      .filter((f) => f.status === 'published')
      .sort((a, b) => a.display_order - b.display_order),
    articles: state.cmsArticles
      .filter((a) => a.status === 'published')
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()),
    pages: state.cmsPages.filter((p) => p.status === 'published'),
  };
}

export async function adminSaveCmsPage(admin: Profile, page: Partial<CmsPage> & { slug: string; title: string; content: string }): Promise<CmsPage> {
  if (admin.role !== 'admin') throw new Error('Accès refusé.');
  const state = loadState();
  const now = new Date().toISOString();
  const idx = state.cmsPages.findIndex((p) => p.id === page.id || p.slug === page.slug);

  const saved: CmsPage =
    idx >= 0
      ? {
          ...state.cmsPages[idx],
          title: sanitizeText(page.title),
          subtitle: page.subtitle ? sanitizeText(page.subtitle) : null,
          content: sanitizeText(page.content),
          status: page.status || state.cmsPages[idx].status,
          seo_title: page.seo_title ? sanitizeText(page.seo_title) : null,
          seo_description: page.seo_description ? sanitizeText(page.seo_description) : null,
          updated_at: now,
        }
      : {
          id: crypto.randomUUID(),
          slug: sanitizeText(page.slug),
          title: sanitizeText(page.title),
          subtitle: page.subtitle ? sanitizeText(page.subtitle) : null,
          content: sanitizeText(page.content),
          sections_json: {},
          status: page.status || 'published',
          seo_title: page.seo_title ? sanitizeText(page.seo_title) : null,
          seo_description: page.seo_description ? sanitizeText(page.seo_description) : null,
          published_at: now,
          updated_at: now,
        };

  if (idx >= 0) state.cmsPages[idx] = saved;
  else state.cmsPages.push(saved);

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: 'CMS_SAVE_PAGE',
    entity_type: 'page',
    entity_id: saved.slug,
    details: { title: saved.title, status: saved.status },
    created_at: now,
  });

  saveState(state);
  try {
    await withTimeout(supabase.from('pages').upsert(saved, { onConflict: 'slug' }), 2000);
  } catch {

  }
  return saved;
}

export async function adminSaveCmsArticle(
  admin: Profile,
  article: Partial<CmsArticle> & { slug: string; title: string; excerpt: string; content: string; category: string }
): Promise<CmsArticle> {
  if (admin.role !== 'admin') throw new Error('Accès refusé.');
  const state = loadState();
  const now = new Date().toISOString();
  const idx = state.cmsArticles.findIndex((a) => a.id === article.id || a.slug === article.slug);

  const saved: CmsArticle =
    idx >= 0
      ? {
          ...state.cmsArticles[idx],
          title: sanitizeText(article.title),
          excerpt: sanitizeText(article.excerpt),
          content: sanitizeText(article.content),
          category: sanitizeText(article.category),
          cover_image_url: article.cover_image_url || state.cmsArticles[idx].cover_image_url,
          status: article.status || state.cmsArticles[idx].status,
          seo_title: article.seo_title ? sanitizeText(article.seo_title) : null,
          seo_description: article.seo_description ? sanitizeText(article.seo_description) : null,
          updated_at: now,
        }
      : {
          id: crypto.randomUUID(),
          slug: sanitizeText(article.slug),
          title: sanitizeText(article.title),
          excerpt: sanitizeText(article.excerpt),
          content: sanitizeText(article.content),
          category: sanitizeText(article.category),
          cover_image_url:
            article.cover_image_url ||
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
          reading_time_min: article.reading_time_min || 5,
          author_name: admin.full_name,
          status: article.status || 'published',
          seo_title: article.seo_title ? sanitizeText(article.seo_title) : null,
          seo_description: article.seo_description ? sanitizeText(article.seo_description) : null,
          published_at: now,
          updated_at: now,
        };

  if (idx >= 0) state.cmsArticles[idx] = saved;
  else state.cmsArticles.unshift(saved);

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: 'CMS_SAVE_ARTICLE',
    entity_type: 'article',
    entity_id: saved.slug,
    details: { title: saved.title, status: saved.status },
    created_at: now,
  });

  saveState(state);
  try {
    await withTimeout(supabase.from('articles').upsert(saved, { onConflict: 'slug' }), 2000);
  } catch {

  }
  return saved;
}

export async function adminSaveFaq(
  admin: Profile,
  faq: Partial<FaqItem> & { question: string; answer: string; category: string }
): Promise<FaqItem> {
  if (admin.role !== 'admin') throw new Error('Accès refusé.');
  const state = loadState();
  const now = new Date().toISOString();
  const idx = state.faqs.findIndex((f) => f.id === faq.id);

  const saved: FaqItem =
    idx >= 0
      ? {
          ...state.faqs[idx],
          question: sanitizeText(faq.question),
          answer: sanitizeText(faq.answer),
          category: sanitizeText(faq.category),
          status: faq.status || state.faqs[idx].status,
          updated_at: now,
        }
      : {
          id: crypto.randomUUID(),
          question: sanitizeText(faq.question),
          answer: sanitizeText(faq.answer),
          category: sanitizeText(faq.category),
          display_order: state.faqs.length + 1,
          status: faq.status || 'published',
          updated_at: now,
        };

  if (idx >= 0) state.faqs[idx] = saved;
  else state.faqs.push(saved);

  saveState(state);
  try {
    await withTimeout(supabase.from('faqs').upsert(saved), 2000);
  } catch {

  }
  return saved;
}

export async function adminSaveCity(
  admin: Profile,
  cityInput: Partial<City> & { name: string; slug: string; department: string; region: string; description: string }
): Promise<City> {
  if (admin.role !== 'admin') throw new Error('Accès refusé.');
  const state = loadState();
  const idx = state.cities.findIndex((c) => c.id === cityInput.id || c.slug === cityInput.slug);

  const saved: City =
    idx >= 0
      ? {
          ...state.cities[idx],
          ...cityInput,
          name: sanitizeText(cityInput.name),
          description: sanitizeText(cityInput.description),
        }
      : {
          id: crypto.randomUUID(),
          name: sanitizeText(cityInput.name),
          slug: sanitizeText(cityInput.slug.toLowerCase()),
          postal_codes: cityInput.postal_codes || [],
          department: sanitizeText(cityInput.department),
          region: sanitizeText(cityInput.region),
          student_population: Number(cityInput.student_population || 50000),
          avg_student_rent: Number(cityInput.avg_student_rent || 550),
          description: sanitizeText(cityInput.description),
          universities: cityInput.universities || [],
          neighborhoods: cityInput.neighborhoods || [],
          hero_image_url:
            cityInput.hero_image_url ||
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
          is_featured: cityInput.is_featured ?? true,
          seo_title: cityInput.seo_title || `Logement Étudiant à ${cityInput.name} | ErikaLog`,
          seo_description: cityInput.seo_description || cityInput.description.slice(0, 155),
          display_order: state.cities.length + 1,
        };

  if (idx >= 0) state.cities[idx] = saved;
  else state.cities.push(saved);

  saveState(state);
  try {
    await withTimeout(supabase.from('cities').upsert(saved, { onConflict: 'slug' }), 2000);
  } catch {

  }
  return saved;
}

export async function adminUpdateSiteSettings(
  admin: Profile,
  updates: Partial<SiteSettings>
): Promise<SiteSettings> {
  if (admin.role !== 'admin') throw new Error('Accès refusé.');
  const state = loadState();
  const now = new Date().toISOString();

  state.siteSettings = {
    ...state.siteSettings,
    ...updates,
    id: 1,
    updated_at: now,
  };

  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id,
    action_type: 'UPDATE_SITE_SETTINGS',
    entity_type: 'site_settings',
    entity_id: '1',
    details: updates as Record<string, unknown>,
    created_at: now,
  });

  saveState(state);
  try {
    await withTimeout(
      supabase.from('site_settings').update(state.siteSettings).eq('id', 1),
      2000
    );
  } catch {

  }
  return state.siteSettings;
}

export async function submitPublicContactMessage(input: {
  full_name: string;
  email: string;
  subject: string;
  profile_type: string;
  message: string;
}): Promise<void> {
  try {
    await withTimeout(
      supabase.from('contact_messages').insert({
        full_name: sanitizeText(input.full_name),
        email: input.email.trim(),
        subject: sanitizeText(input.subject),
        profile_type: input.profile_type,
        message: sanitizeText(input.message),
      }),
      2000
    );
  } catch {

  }
}

export function getPublishedArticles(): CmsArticle[] {
  return getPublicReferenceData().articles;
}

export function getArticleBySlug(slug: string): CmsArticle | null {
  return getPublicReferenceData().articles.find((a) => a.slug === slug) || null;
}

export function getPublishedFaqs(): FaqItem[] {
  return getPublicReferenceData().faqs;
}

export function getPageBySlug(slug: string): CmsPage | null {
  return getPublicReferenceData().pages.find((p) => p.slug === slug) || null;
}

export async function submitContactForm(input: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  profileType?: string;
}): Promise<void> {
  await submitPublicContactMessage({
    full_name: input.fullName,
    email: input.email,
    subject: input.subject,
    profile_type: input.profileType || 'Visiteur',
    message: input.message,
  });
}

