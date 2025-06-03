-- Ajout de la colonne current_organization_id à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id);

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_users_current_organization_id ON public.users(current_organization_id); 