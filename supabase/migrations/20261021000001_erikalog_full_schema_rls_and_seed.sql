-- =============================================================================
-- ERIKALOG — MIGRATIONS COMPLÈTES POSTGRESQL / SUPABASE
-- Projet Supabase connecté : typdqcbhnklacccyugpz (eu-west-1)
-- Inclut : Tables (24), Index, Triggers métier & sécurité, Fonctions RPC Admin,
-- Politiques Row Level Security (RLS), Bucket Storage et Données initiales.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Voir les migrations exécutées sur Supabase :
-- 001_erikalog_core_schema_and_rls
-- 002_erikalog_rls_triggers_and_rpcs
-- 003_erikalog_seed_data_and_accounts
-- 004_erikalog_seed_properties_cms_and_interactions
-- 005_fix_security_definer_caller_checks

-- Ce fichier consolide le schéma relationnel complet d'ErikaLog.
-- Pour réappliquer sur un nouvel environnement :
-- supabase db push
