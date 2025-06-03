-- Ajout de la colonne is_archived à la table projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Création de la table organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    company_size TEXT,
    company_address TEXT,
    company_website TEXT,
    primary_language TEXT NOT NULL CHECK (primary_language IN ('FR', 'EN')),
    timezone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('prospect', 'active', 'inactive', 'archived')),
    acquisition_source TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ajout de la colonne current_organization_id à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id);

-- Création de la table organization_projects
CREATE TABLE IF NOT EXISTS public.organization_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ajout d'un index sur organization_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_organization_projects_organization_id ON public.organization_projects(organization_id);

-- Ajout d'un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour organization_projects
CREATE TRIGGER update_organization_projects_updated_at
    BEFORE UPDATE ON public.organization_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 