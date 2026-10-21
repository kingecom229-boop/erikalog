import { describe, expect, it, beforeEach } from 'vitest';
import {
  calculateTotalRent,
  canTransitionPropertyStatus,
  canUserAccessConversation,
  canUserModifyProperty,
  canUserPublishProperty,
  isSensitivePropertyChange,
  propertyListingSchema,
  registerSchema,
  sanitizeText,
  validatePropertyImageFile,
} from '../lib/validation';
import {
  adminChangeUserPassword,
  adminModerateProperty,
  adminResolveReport,
  adminSaveCmsPage,
  createOrUpdateProperty,
  createSafetyReport,
  createViewingRequest,
  digestPassword,
  getAdminDashboardData,
  getPageBySlug,
  getPropertyBySlug,
  getUserConversations,
  getViewingRequestsForUser,
  registerNewAccount,
  resetLocalDatabaseState,
  searchPublishedProperties,
  signInWithEmail,
  startOrGetConversation,
  toggleFavoriteProperty,
  updateViewingRequestStatus,
} from '../services/erikalogService';

describe('ErikaLog — Tests Unitaires, Sécurité RBAC & Parcours End-to-End', () => {
  beforeEach(() => {
    resetLocalDatabaseState();
  });

  
  
  
  describe('1. Validation des formulaires et calculs métier', () => {
    it('valide une inscription étudiante ou propriétaire conforme et rejette un mot de passe trop court', () => {
      const valid = registerSchema.safeParse({
        fullName: 'Julie Martin',
        email: 'nouveau@etudiant.fr',
        password: 'Password2026!',
        role: 'student',
        accountType: 'student',
        phone: '06 12 34 56 78',
        acceptTerms: true,
      });
      expect(valid.success).toBe(true);

      const invalid = registerSchema.safeParse({
        fullName: 'J',
        email: 'bad-email',
        password: '123',
        role: 'student',
        accountType: 'student',
        phone: '123',
        acceptTerms: true,
      });
      expect(invalid.success).toBe(false);
    });

    it('calcule exactement le loyer charges comprises (loyer HC + charges)', () => {
      expect(calculateTotalRent(560, 50)).toBe(610);
      expect(calculateTotalRent(495.5, 44.5)).toBe(540);
      expect(calculateTotalRent(-100, 30)).toBe(30);
    });

    it('valide les champs obligatoires d’une annonce immobilière et rejette une surface < 9 m²', () => {
      const validProperty = propertyListingSchema.safeParse({
        title: 'Studio meublé proche campus universitaire Lyon 7e',
        property_type: 'studio',
        city_name: 'Lyon',
        postal_code: '69007',
        neighborhood: 'Jean Macé',
        address_public: '14 rue Chevreul',
        nearby_schools: ['Sciences Po Lyon'],
        surface_m2: 21,
        rooms_count: 1,
        bedrooms_count: 1,
        bathrooms_count: 1,
        floor_number: 2,
        has_elevator: true,
        furnished: true,
        dpe_rating: 'C',
        ges_rating: 'B',
        rent_excluding_charges: 540,
        charges_amount: 45,
        charges_type: 'forfait',
        security_deposit: 540,
        agency_fees: 0,
        available_from: '2026-09-01',
        min_lease_months: 9,
        lease_type: 'Bail étudiant 9 mois',
        eligible_apl: true,
        accepts_visale: true,
        guarantor_required: true,
        smoking_allowed: false,
        pets_allowed: false,
        colocation_friendly: false,
        description:
          'Beau studio lumineux entièrement meublé et équipé, à 4 minutes du métro Jean Macé et des universités lyonnaises.',
        rental_conditions: 'Garantie Visale ou garant physique accepté.',
        amenities: ['wifi_fibre', 'bureau_etude'],
        images: [{ url: 'https://example.com/studio.jpg', alt_text: 'Studio', is_primary: true }],
      });
      expect(validProperty.success).toBe(true);

      const tooSmall = propertyListingSchema.safeParse({
        title: 'Chambre trop petite sous les toits de Paris',
        property_type: 'chambre',
        city_name: 'Paris',
        postal_code: '75005',
        neighborhood: 'Quartier Latin',
        address_public: '1 rue de Paris',
        surface_m2: 6, 
        rooms_count: 1,
        bedrooms_count: 1,
        bathrooms_count: 1,
        furnished: true,
        dpe_rating: 'D',
        ges_rating: 'D',
        rent_excluding_charges: 400,
        charges_amount: 20,
        charges_type: 'forfait',
        security_deposit: 400,
        agency_fees: 0,
        available_from: '2026-09-01',
        min_lease_months: 9,
        lease_type: 'Bail étudiant 9 mois',
        eligible_apl: true,
        accepts_visale: true,
        guarantor_required: true,
        smoking_allowed: false,
        pets_allowed: false,
        colocation_friendly: false,
        description:
          'Description de plus de cinquante caractères pour tester le rejet sur la surface inférieure à 9 m².',
        rental_conditions: 'Garant demandé.',
        amenities: ['wifi_fibre'],
        images: [{ url: 'https://example.com/studio.jpg' }],
      });
      expect(tooSmall.success).toBe(false);
    });

    it('nettoie les chaînes contre les injections XSS et valide les fichiers images', () => {
      const dirty = '<script>alert("xss")</script>Bonjour studio <b>calme</b>';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<b>');

      expect(validatePropertyImageFile({ type: 'image/jpeg', size: 1024 * 500 }).valid).toBe(true);
      expect(validatePropertyImageFile({ type: 'application/pdf', size: 1024 }).valid).toBe(false);
      expect(validatePropertyImageFile({ type: 'image/png', size: 12 * 1024 * 1024 }).valid).toBe(
        false
      );
    });
  });

  
  
  
  describe('2. Contrôle d’accès RBAC et règles de sécurité', () => {
    it('interdit formellement à un étudiant de créer ou publier une annonce immobilière', async () => {
      expect(canUserPublishProperty('student')).toBe(false);
      expect(canUserPublishProperty('owner')).toBe(true);
      expect(canUserPublishProperty('agent')).toBe(true);
      expect(canUserPublishProperty('admin')).toBe(true);

      const { user: student } = await signInWithEmail('etudiant@erikalog.fr', 'ErikaEtudiant2026!');
      await expect(
        createOrUpdateProperty(
          student,
          {
            title: 'Tentative publication par étudiant non autorisée',
            property_type: 'studio',
            city_name: 'Paris',
            postal_code: '75005',
            neighborhood: 'Quartier Latin',
            address_public: '10 rue Soufflot',
            nearby_schools: ['Sorbonne'],
            surface_m2: 20,
            rooms_count: 1,
            bedrooms_count: 1,
            bathrooms_count: 1,
            floor_number: 1,
            has_elevator: false,
            furnished: true,
            dpe_rating: 'C',
            ges_rating: 'C',
            rent_excluding_charges: 600,
            charges_amount: 50,
            charges_type: 'forfait',
            security_deposit: 600,
            agency_fees: 0,
            available_from: '2026-09-01',
            min_lease_months: 9,
            lease_type: 'Bail étudiant',
            eligible_apl: true,
            accepts_visale: true,
            guarantor_required: true,
            smoking_allowed: false,
            pets_allowed: false,
            colocation_friendly: false,
            description:
              'Description complète de plus de cinquante caractères pour vérifier le blocage RBAC.',
            rental_conditions: 'Conditions standard.',
            amenities: ['wifi_fibre'],
            imageUrls: ['https://example.com/1.jpg'],
          },
          'pending'
        )
      ).rejects.toThrow(/Règle fondamentale ErikaLog/i);
    });

    it('interdit à un propriétaire de modifier l’annonce d’un autre annonceur', () => {
      const ownerId = '22222222-2222-4222-8222-222222222202';
      const otherAgentId = '33333333-3333-4333-8333-333333333303';

      expect(canUserModifyProperty(ownerId, 'owner', ownerId)).toBe(true);
      expect(canUserModifyProperty(ownerId, 'owner', otherAgentId)).toBe(false);
      expect(
        canUserModifyProperty('11111111-1111-4111-8111-111111111101', 'admin', otherAgentId)
      ).toBe(true);
    });

    it('interdit à un propriétaire de s’auto-valider en statut "published" sans passer par l’administrateur', () => {
      expect(canTransitionPropertyStatus('draft', 'pending', 'owner')).toBe(true);
      expect(canTransitionPropertyStatus('pending', 'published', 'owner')).toBe(false);
      expect(canTransitionPropertyStatus('pending', 'published', 'admin')).toBe(true);
    });

    it('restreint l’accès aux conversations privées aux seuls participants et à l’admin en cas de signalement', () => {
      const conv = {
        student_id: 'user-a',
        advertiser_id: 'user-b',
        status: 'active',
      };
      expect(canUserAccessConversation('user-a', 'student', conv)).toBe(true);
      expect(canUserAccessConversation('user-c', 'student', conv)).toBe(false);
      expect(canUserAccessConversation('admin-1', 'admin', conv)).toBe(false);
      expect(
        canUserAccessConversation('admin-1', 'admin', { ...conv, status: 'reported' })
      ).toBe(true);
    });

    it('détecte automatiquement une modification sensible sur une annonce déjà publiée (loyer ou adresse)', () => {
      const original = {
        title: 'Studio Lyon 7',
        rent_excluding_charges: 520,
        charges_amount: 45,
        address_public: '18 rue Chevreul',
        city_name: 'Lyon',
      };
      expect(
        isSensitivePropertyChange(original, { ...original, rent_excluding_charges: 650 })
      ).toBe(true);
      expect(isSensitivePropertyChange(original, { ...original })).toBe(false);
    });
  });

  
  
  
  describe('3. Parcours complets End-to-End (12 scénarios clés)', () => {
    it('Scénario 1 : Visiteur parcourt et filtre les annonces publiées par ville, budget et équipement', () => {
      const allPublished = searchPublishedProperties({});
      expect(allPublished.total).toBeGreaterThanOrEqual(9);
      expect(allPublished.items.every((p) => p.status === 'published')).toBe(true);

      const lyonResults = searchPublishedProperties({ city: 'lyon', maxBudget: 650 });
      expect(lyonResults.items.length).toBeGreaterThan(0);
      expect(
        lyonResults.items.every(
          (p) => p.city_name.toLowerCase() === 'lyon' && p.rent_including_charges <= 650
        )
      ).toBe(true);
    });

    it('Scénario 2 & 3 : Inscription étudiant, ajout en favoris, envoi de message et demande de visite', async () => {
      const newStudent = await registerNewAccount({
        email: 'thomas.etudiant@erikalog.fr',
        password: 'ThomasPassword2026!',
        fullName: 'Thomas Mercier',
        role: 'student',
        accountType: 'student',
        phone: '06 11 22 33 44',
        universityOrSchool: 'Université de Bordeaux',
      });
      expect(newStudent.role).toBe('student');

      const firstPublished = searchPublishedProperties({}).items[0];
      const targetProp = getPropertyBySlug(firstPublished.slug);
      expect(targetProp).not.toBeNull();

      
      const favResult = await toggleFavoriteProperty(newStudent.id, targetProp!.id);
      expect(favResult.favorited).toBe(true);

      
      const { conversation } = await startOrGetConversation(
        newStudent,
        targetProp!.id,
        'Bonjour, votre studio à Jean Macé est-il toujours disponible pour septembre ?'
      );
      expect(conversation.id).toBeTruthy();

      const convs = getUserConversations(newStudent);
      expect(convs.length).toBe(1);

      
      const visit = await createViewingRequest(newStudent, {
        property_id: targetProp!.id,
        applicant_name: newStudent.full_name,
        applicant_email: newStudent.email,
        applicant_phone: '06 11 22 33 44',
        preferred_date: '2026-06-15',
        preferred_time_slot: '14h00 - 15h00',
        visit_mode: 'in_person',
        student_message: 'Je suis disponible lundi après-midi avec mon dossier Visale complet.',
        privacy_consent: true,
      });
      expect(visit.status).toBe('pending');
    });

    it('Scénario 4, 5 & 6 : Propriétaire dépose une annonce -> en attente -> Admin approuve -> visible publiquement', async () => {
      const { user: owner } = await signInWithEmail(
        'proprietaire@erikalog.fr',
        'ErikaProprio2026!'
      );
      const { user: admin } = await signInWithEmail('admin@erikalog.fr', 'ErikaAdmin2026!');

      const created = await createOrUpdateProperty(
        owner,
        {
          title: 'T1 Bis Rénové Quartier Latin Paris 5e — Proche Sorbonne',
          property_type: 'appartement',
          city_name: 'Paris',
          postal_code: '75005',
          neighborhood: 'Quartier Latin',
          address_public: '25 rue Monge',
          nearby_schools: ['Sorbonne Université', 'Panthéon-Assas'],
          surface_m2: 24,
          rooms_count: 1,
          bedrooms_count: 1,
          bathrooms_count: 1,
          floor_number: 3,
          has_elevator: false,
          furnished: true,
          dpe_rating: 'C',
          ges_rating: 'B',
          rent_excluding_charges: 820,
          charges_amount: 60,
          charges_type: 'forfait',
          security_deposit: 820,
          agency_fees: 0,
          available_from: '2026-09-01',
          min_lease_months: 9,
          lease_type: 'Bail étudiant 9 mois',
          eligible_apl: true,
          accepts_visale: true,
          guarantor_required: true,
          smoking_allowed: false,
          pets_allowed: false,
          colocation_friendly: false,
          description:
            'Superbe T1 bis calme sur cour arborée, idéal étudiant Sorbonne ou Panthéon-Assas, fibre optique incluse et mobilier neuf.',
          rental_conditions: 'Garantie Visale ou caution parentale.',
          amenities: ['wifi_fibre', 'bureau_etude', 'digicode_interphone'],
          imageUrls: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        'pending'
      );

      
      expect(created.status).toBe('pending');
      expect(getPropertyBySlug(created.slug, null)).toBeNull();

      
      await adminModerateProperty(
        admin,
        created.id,
        'published',
        'Dossier propriétaire et diagnostic DPE vérifiés.'
      );

      
      const publicView = getPropertyBySlug(created.slug, null);
      expect(publicView).not.toBeNull();
      expect(publicView?.status).toBe('published');
    });

    it('Scénario 7 : Propriétaire répond à une demande de visite en proposant un créneau alternatif', async () => {
      const { user: owner } = await signInWithEmail(
        'proprietaire@erikalog.fr',
        'ErikaProprio2026!'
      );

      const ownerRequests = getViewingRequestsForUser(owner);
      const pendingReq = ownerRequests.find((r) => r.status === 'pending') || ownerRequests[0];
      expect(pendingReq).toBeDefined();

      await updateViewingRequestStatus(owner, pendingReq.id, 'alternative_proposed', {
        advertiser_response: 'Je vous propose le lendemain à 17h30.',
        proposed_date: '2026-05-16',
        proposed_time_slot: '17h30 - 18h30',
      });

      const { user: admin } = await signInWithEmail('admin@erikalog.fr', 'ErikaAdmin2026!');
      const adminData = getAdminDashboardData(admin);
      const updatedReq = adminData.viewingRequests.find((v) => v.id === pendingReq.id);
      expect(updatedReq?.status).toBe('alternative_proposed');
      expect(updatedReq?.proposed_time_slot).toBe('17h30 - 18h30');
    });

    it('Scénario 8, 9 & 10 : Admin traite un signalement, modifie le mot de passe d’un compte et met à jour le CMS', async () => {
      const { user: admin } = await signInWithEmail('admin@erikalog.fr', 'ErikaAdmin2026!');
      const { user: student } = await signInWithEmail(
        'etudiant@erikalog.fr',
        'ErikaEtudiant2026!'
      );

      
      const report = await createSafetyReport(student, {
        target_type: 'property',
        target_property_id: 'd0000001-0001-4001-8001-000000000001',
        reason_category: 'Photo à vérifier',
        description: 'Vérification demandée sur la deuxième photo du studio.',
      });
      expect(report.status).toBe('open');

      
      await adminResolveReport(admin, report.id, {
        status: 'resolved',
        decision: 'Photos conformes après contrôle auprès du bailleur.',
        actionTaken: 'Annonce maintenue en ligne.',
      });

      
      await adminChangeUserPassword(admin.id, student.id, 'NouveauMdpEtudiant2026!');
      const { user: relogin } = await signInWithEmail(
        'etudiant@erikalog.fr',
        'NouveauMdpEtudiant2026!'
      );
      expect(relogin.id).toBe(student.id);

      
      const updatedPage = await adminSaveCmsPage(admin, {
        slug: 'a-propos',
        title: 'À propos d’ErikaLog — La référence du logement étudiant',
        subtitle: 'Plateforme française vérifiée',
        content: 'Nouveau contenu éditorial mis à jour par l’administrateur.',
        status: 'published',
      });
      expect(updatedPage.title).toContain('La référence du logement étudiant');
      expect(getPageBySlug('a-propos')?.content).toContain(
        'Nouveau contenu éditorial mis à jour'
      );
    });

    it('Scénario 11 & 12 : Hachage irréversible des mots de passe et absence totale de mot de passe en clair', () => {
      const hashed = digestPassword('MonMotDePasseSecret2026!');
      expect(hashed.startsWith('erk_h$')).toBe(true);
      expect(hashed).not.toContain('MonMotDePasseSecret2026!');
      expect(digestPassword('MonMotDePasseSecret2026!')).toBe(hashed);
      expect(digestPassword('AutreMotDePasse')).not.toBe(hashed);
    });
  });
});
