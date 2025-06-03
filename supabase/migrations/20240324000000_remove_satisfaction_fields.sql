-- Suppression des colonnes satisfaction_score et feedback de la table organization_projects
ALTER TABLE public.organization_projects
DROP COLUMN IF EXISTS satisfaction_score,
DROP COLUMN IF EXISTS feedback; 