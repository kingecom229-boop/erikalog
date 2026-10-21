# ErikaLog — Plateforme Française de Logement Étudiant

**ErikaLog** est une plateforme web complète et sécurisée dédiée à la recherche et à la gestion de logements étudiants en France. Elle met en relation directe les **étudiants** en recherche d'un logement décent (studio, appartement, chambre, colocation, résidence étudiante) avec des **propriétaires bailleurs particuliers**, des **agences immobilières** et des **gestionnaires de résidences étudiantes**.

> **Règle fondamentale ErikaLog (appliquée côté client et côté serveur PostgreSQL / RLS)** :
> Les logements sont **exclusivement publiés par les propriétaires particuliers, les agents/agences immobilières ou les administrateurs**. Un compte étudiant (`student`) ne peut en aucun cas créer, modifier ou publier une annonce immobilière.

---

## 🏗️ Architecture Technique & Identité Visuelle

- **Frontend** : React 18, TypeScript, Vite 6, Tailwind CSS 3, React Router v6, Lucide Icons, Zod.
- **Identité & UX** :
  - Charte graphique officielle **ErikaLog** (Bleu Royal `#003B95` & Orange Académique `#F97316`) avec logo et favicon officiels (`/logo.png`, `/favicon.png`).
  - **Mode Clair / Mode Sombre** (bascule Soleil/Lune dans la Navbar, persistée dans `localStorage`).
  - **Bilingue Français / Anglais** (`FR` / `EN` dans la Navbar, français par défaut, persisté dans `localStorage`).
  - **Gestion des Cookies RGPD/CNIL** : installation effective des cookies navigateur (`erikalog_cookie_consent`, `erikalog_essential`, `erikalog_preferences`, `erikalog_analytics`) après consentement.
- **Backend & Base de données Supabase** :
  - **24 tables relationnelles** avec clés étrangères, index de recherche et contraintes d'intégrité.
  - **Row Level Security (RLS)** activée sur 100 % des tables publiques.
  - **Triggers PostgreSQL** (`trg_protect_profile_escalation`, `trg_enforce_property_rules`, `trg_handle_new_message`, `trg_handle_viewing_request_changes`).
  - **Bucket Storage** : `property-images`.
  - **Edge Function** : `erikalog-notify`.

---

## 💻 Configuration & Commandes Locales

1. Copiez `.env.example` vers `.env` et renseignez vos variables Supabase :
```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique-anon
```

2. Commandes de travail en local :
```bash
npm install
npm run dev
npm test
npm run build
```
