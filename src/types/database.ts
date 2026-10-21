export type UserRole = 'student' | 'owner' | 'agent' | 'admin';

export type AccountType =
  | 'student'
  | 'individual_owner'
  | 'real_estate_agent'
  | 'residence_manager'
  | 'admin';

export type UserStatus = 'active' | 'suspended' | 'deletion_requested';

export type PropertyTypeSlug =
  | 'studio'
  | 'appartement'
  | 'chambre'
  | 'colocation'
  | 'residence_etudiante';

export type PropertyStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected'
  | 'rented'
  | 'unavailable'
  | 'archived'
  | 'suspended';

export type ViewingStatus =
  | 'pending'
  | 'accepted'
  | 'alternative_proposed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type EditorialStatus = 'draft' | 'published' | 'archived';

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface NotificationPrefs {
  email_messages: boolean;
  email_viewings: boolean;
  email_moderation: boolean;
  in_app_all: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_type: AccountType;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  university_or_school: string | null;
  study_city: string | null;
  max_budget: number | null;
  guarantor_type: string | null;
  company_name: string | null;
  siret: string | null;
  professional_card: string | null;
  organization_id: string | null;
  is_verified: boolean;
  email_confirmed: boolean;
  status: UserStatus;
  deletion_requested_at?: string | null;
  deletion_reason?: string | null;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  postal_codes: string[];
  department: string;
  region: string;
  student_population: number;
  avg_student_rent: number;
  description: string;
  universities: string[];
  neighborhoods: string[];
  hero_image_url: string | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  display_order: number;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface Amenity {
  id: string;
  slug: string;
  label: string;
  category: string;
  icon: string;
  is_active: boolean;
}

export interface Property {
  id: string;
  slug: string;
  reference: string;
  owner_id: string;
  organization_id: string | null;
  title: string;
  property_type: PropertyTypeSlug;
  status: PropertyStatus;
  rejection_reason: string | null;
  city_id: string | null;
  city_name: string;
  postal_code: string;
  neighborhood: string | null;
  address_public: string;
  address_private: string | null;
  nearby_schools: string[];
  latitude: number | null;
  longitude: number | null;
  surface_m2: number;
  rooms_count: number;
  bedrooms_count: number;
  bathrooms_count: number;
  floor_number: number | null;
  has_elevator: boolean;
  furnished: boolean;
  dpe_rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS';
  ges_rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'NS';
  rent_excluding_charges: number;
  charges_amount: number;
  rent_including_charges: number;
  charges_type: 'forfait' | 'provision' | 'incluses';
  security_deposit: number;
  agency_fees: number;
  available_from: string;
  min_lease_months: number;
  lease_type: string;
  eligible_apl: boolean;
  accepts_visale: boolean;
  guarantor_required: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  colocation_friendly: boolean;
  description: string;
  rental_conditions: string | null;
  cover_image_url: string | null;
  views_count: number;
  is_demo: boolean;
  is_featured: boolean;
  submitted_at: string | null;
  published_at: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  
  owner?: Profile;
  images?: PropertyImage[];
  amenities?: string[];
}

export interface SearchFilters {
  query?: string;
  city?: string;
  postalCode?: string;
  neighborhood?: string;
  school?: string;
  propertyType?: PropertyTypeSlug | '';
  minBudget?: number | '';
  maxBudget?: number | '';
  minSurface?: number | '';
  maxSurface?: number | '';
  furnished?: 'all' | 'true' | 'false';
  availableFrom?: string;
  eligibleApl?: boolean;
  acceptsVisale?: boolean;
  amenities?: string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc';
  page?: number;
  pageSize?: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  email_alerts: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  property_id: string | null;
  student_id: string;
  advertiser_id: string;
  subject: string | null;
  status: 'active' | 'archived' | 'reported' | 'blocked';
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  property?: Property;
  student?: Profile;
  advertiser?: Profile;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface ViewingRequest {
  id: string;
  property_id: string;
  student_id: string;
  advertiser_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  preferred_date: string;
  preferred_time_slot: string;
  visit_mode: 'in_person' | 'video';
  student_message: string | null;
  privacy_consent: boolean;
  status: ViewingStatus;
  proposed_date: string | null;
  proposed_time_slot: string | null;
  advertiser_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  student?: Profile;
  advertiser?: Profile;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  email_dispatched: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_type: 'property' | 'user' | 'conversation';
  target_property_id: string | null;
  target_user_id: string | null;
  target_conversation_id: string | null;
  reason_category: string;
  description: string;
  status: ReportStatus;
  admin_decision: string | null;
  action_taken: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter?: Profile;
  target_property?: Property;
  target_user?: Profile;
}

export interface ModerationLog {
  id: string;
  property_id: string | null;
  moderator_id: string | null;
  previous_status: string | null;
  new_status: string;
  reason: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  sections_json: Record<string, unknown>;
  status: EditorialStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
  updated_at: string;
}

export interface CmsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image_url: string | null;
  reading_time_min: number;
  author_name: string;
  status: EditorialStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  status: EditorialStatus;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  tagline: string;
  contact_email: string;
  support_phone: string;
  company_address: string;
  hero_title: string;
  hero_subtitle: string;
  require_moderation_before_publish: boolean;
  revalidate_on_sensitive_edit: boolean;
  enable_visit_requests: boolean;
  enable_private_messaging: boolean;
  enable_student_registration: boolean;
  enable_advertiser_registration: boolean;
  show_demo_badge: boolean;
  default_seo_title: string;
  default_seo_description: string;
  navigation_links: Array<{ label: string; href: string }>;
  footer_config: Record<string, string>;
  updated_at: string;
}
