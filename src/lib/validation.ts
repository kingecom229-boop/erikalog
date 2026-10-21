import { z } from 'zod';
import type { PropertyStatus, UserRole, ViewingStatus } from '../types/database';

export function canUserPublishProperty(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'owner' || role === 'agent' || role === 'admin';
}

export function canUserModifyProperty(
  userId: string | null | undefined,
  role: UserRole | null | undefined,
  propertyOwnerId: string
): boolean {
  if (!userId || !role) return false;
  if (role === 'admin') return true;
  if (role === 'student') return false;
  return userId === propertyOwnerId;
}

export function canUserAccessConversation(
  userId: string | null | undefined,
  role: UserRole | null | undefined,
  conversation: { student_id: string; advertiser_id: string; status: string }
): boolean {
  if (!userId || !role) return false;
  if (userId === conversation.student_id || userId === conversation.advertiser_id) {
    return true;
  }
  
  if (role === 'admin' && conversation.status === 'reported') {
    return true;
  }
  return false;
}

const ADVERTISER_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  draft: ['draft', 'pending', 'archived'],
  pending: ['draft', 'pending', 'archived'],
  published: ['pending', 'rented', 'unavailable', 'archived'],
  rejected: ['draft', 'pending', 'archived'],
  rented: ['pending', 'unavailable', 'archived'],
  unavailable: ['pending', 'rented', 'archived'],
  archived: ['draft', 'pending'],
  suspended: [], // Seul un administrateur peut lever une suspension
};

const ADMIN_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  draft: ['draft', 'pending', 'published', 'rejected', 'suspended', 'archived'],
  pending: ['published', 'rejected', 'suspended', 'archived', 'draft'],
  published: ['pending', 'rejected', 'suspended', 'rented', 'unavailable', 'archived'],
  rejected: ['published', 'pending', 'suspended', 'archived'],
  rented: ['published', 'pending', 'archived', 'suspended'],
  unavailable: ['published', 'pending', 'archived', 'suspended'],
  archived: ['draft', 'pending', 'published'],
  suspended: ['published', 'pending', 'rejected', 'archived'],
};

export function canTransitionPropertyStatus(
  currentStatus: PropertyStatus,
  nextStatus: PropertyStatus,
  role: UserRole
): boolean {
  if (role === 'student') return false;
  if (role === 'admin') {
    return ADMIN_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
  }
  return ADVERTISER_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export function isSensitivePropertyChange(
  previous: {
    title: string;
    rent_excluding_charges: number;
    charges_amount: number;
    city_name: string;
    address_public: string;
  },
  updated: {
    title: string;
    rent_excluding_charges: number;
    charges_amount: number;
    city_name: string;
    address_public: string;
  }
): boolean {
  return (
    previous.title.trim() !== updated.title.trim() ||
    Number(previous.rent_excluding_charges) !== Number(updated.rent_excluding_charges) ||
    Number(previous.charges_amount) !== Number(updated.charges_amount) ||
    previous.city_name.trim().toLowerCase() !== updated.city_name.trim().toLowerCase() ||
    previous.address_public.trim() !== updated.address_public.trim()
  );
}

export function canTransitionViewingStatus(
  currentStatus: ViewingStatus,
  nextStatus: ViewingStatus,
  actorRole: 'student' | 'advertiser' | 'admin'
): boolean {
  if (actorRole === 'student') {
    
    if (nextStatus === 'cancelled' && ['pending', 'accepted', 'alternative_proposed'].includes(currentStatus)) {
      return true;
    }
    if (currentStatus === 'alternative_proposed' && nextStatus === 'accepted') {
      return true;
    }
    return false;
  }
  
  if (currentStatus === 'pending') {
    return ['accepted', 'alternative_proposed', 'declined'].includes(nextStatus);
  }
  if (currentStatus === 'accepted' || currentStatus === 'alternative_proposed') {
    return ['accepted', 'alternative_proposed', 'declined', 'completed', 'cancelled'].includes(nextStatus);
  }
  return false;
}

export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function calculateTotalRent(rentExcludingCharges: number, chargesAmount: number): number {
  const hc = Math.max(0, Number(rentExcludingCharges) || 0);
  const ch = Math.max(0, Number(chargesAmount) || 0);
  return Math.round((hc + ch) * 100) / 100;
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; 
export const MAX_IMAGES_PER_PROPERTY = 10;

export function validatePropertyImageFile(file: { type: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non autorisé. Utilisez uniquement des photos JPG, PNG ou WebP.',
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'La taille de la photo dépasse la limite autorisée de 5 Mo.',
    };
  }
  return { valid: true };
}

export const validateImageFile = validatePropertyImageFile;

export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide.'),
  password: z.string().min(6, 'Mot de passe trop court.'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Veuillez indiquer votre nom complet (minimum 2 caractères).').max(100),
  email: z.string().email('Veuillez saisir une adresse e-mail valide.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(72),
  role: z.enum(['student', 'owner', 'agent']),
  accountType: z.enum(['student', 'individual_owner', 'real_estate_agent', 'residence_manager']),
  phone: z.string().min(8, 'Veuillez indiquer un numéro de téléphone joignable.').max(25),
  universityOrSchool: z.string().optional(),
  studyCity: z.string().optional(),
  companyName: z.string().optional(),
  siret: z.string().optional(),
  professionalCard: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les CGU et la Politique de confidentialité.' }),
  }),
});

export const propertyListingSchema = z.object({
  title: z
    .string()
    .min(12, 'Le titre doit contenir au moins 12 caractères pour être descriptif.')
    .max(140, 'Le titre ne peut pas dépasser 140 caractères.'),
  property_type: z.enum(['studio', 'appartement', 'chambre', 'colocation', 'residence_etudiante']),
  city_name: z.string().min(2, 'La ville est obligatoire.'),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal français doit comporter exactement 5 chiffres (ex: 75005, 69007).'),
  neighborhood: z.string().min(2, 'Veuillez préciser le quartier ou secteur.'),
  address_public: z.string().min(5, 'Veuillez indiquer la rue ou localisation publique.'),
  address_private: z.string().optional(),
  nearby_schools: z.array(z.string()).default([]),
  surface_m2: z
    .number()
    .min(9, 'En France, un logement étudiant décent doit avoir une surface minimale de 9 m².')
    .max(300, 'Surface incohérente.'),
  rooms_count: z.number().int().min(1).max(15),
  bedrooms_count: z.number().int().min(0).max(12),
  bathrooms_count: z.number().int().min(1).max(6),
  floor_number: z.number().int().min(0).max(40).nullable().optional(),
  has_elevator: z.boolean().default(false),
  furnished: z.boolean().default(true),
  dpe_rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'NS']),
  ges_rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'NS']),
  rent_excluding_charges: z
    .number()
    .min(150, 'Le loyer hors charges doit être supérieur ou égal à 150 €.')
    .max(3500, 'Le loyer semble incohérent pour un logement étudiant.'),
  charges_amount: z.number().min(0, 'Les charges ne peuvent pas être négatives.').max(600),
  charges_type: z.enum(['forfait', 'provision', 'incluses']),
  security_deposit: z.number().min(0).max(5000),
  agency_fees: z.number().min(0).max(2000),
  available_from: z.string().min(10, 'La date de disponibilité est requise.'),
  min_lease_months: z.number().int().min(1).max(36),
  lease_type: z.string().min(3),
  eligible_apl: z.boolean(),
  accepts_visale: z.boolean(),
  guarantor_required: z.boolean(),
  smoking_allowed: z.boolean(),
  pets_allowed: z.boolean(),
  colocation_friendly: z.boolean(),
  description: z
    .string()
    .min(50, 'La description doit comporter au moins 50 caractères pour informer correctement les étudiants.')
    .max(4000),
  rental_conditions: z.string().min(10, 'Veuillez préciser les conditions de location et de garantie.'),
  amenities: z.array(z.string()).min(1, 'Sélectionnez au moins un équipement.'),
  images: z
    .array(
      z.object({
        url: z.string().url('URL de photo invalide'),
        alt_text: z.string().optional(),
        is_primary: z.boolean().optional(),
      })
    )
    .min(1, 'Ajoutez au moins une photo du logement.')
    .max(10, 'Maximum 10 photos par annonce.'),
});

export const propertyFormSchema = propertyListingSchema;
export const viewingRequestSchema = z.object({
  property_id: z.string().uuid(),
  applicant_name: z.string().min(2, 'Votre nom est requis.'),
  applicant_email: z.string().email('Adresse e-mail invalide.'),
  applicant_phone: z.string().min(8, 'Numéro de téléphone requis pour organiser la visite.'),
  preferred_date: z.string().min(10, 'Veuillez choisir une date souhaitée.'),
  preferred_time_slot: z.string().min(3, 'Veuillez choisir un créneau horaire.'),
  visit_mode: z.enum(['in_person', 'video']),
  student_message: z.string().max(1500).optional(),
  privacy_consent: z.literal(true, {
    errorMap: () => ({
      message: 'Veuillez accepter la transmission de vos coordonnées de visite à l’annonceur.',
    }),
  }),
});

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z
    .string()
    .min(2, 'Votre message ne peut pas être vide.')
    .max(4000, 'Votre message ne peut pas dépasser 4000 caractères.'),
});

export const reportSchema = z.object({
  target_type: z.enum(['property', 'user', 'conversation']),
  target_property_id: z.string().uuid().optional().nullable(),
  target_user_id: z.string().uuid().optional().nullable(),
  target_conversation_id: z.string().uuid().optional().nullable(),
  reason_category: z.string().min(2, 'Veuillez choisir un motif de signalement.'),
  description: z
    .string()
    .min(15, 'Veuillez détailler votre signalement (minimum 15 caractères).')
    .max(2000),
});
