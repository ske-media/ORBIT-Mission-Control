-- Création de la table clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person_name TEXT,
    contact_person_email TEXT,
    contact_person_phone TEXT,
    company_address TEXT,
    company_website TEXT,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('prospect', 'active', 'inactive', 'archived')) DEFAULT 'prospect',
    source TEXT,
    industry TEXT,
    created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET DEFAULT DEFAULT uuid_nil(),
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.clients IS 'Table stockant les informations détaillées sur les clients et prospects.';

-- Création des index pour la table clients
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_by_user_id ON public.clients(created_by_user_id);
CREATE INDEX idx_clients_assigned_to_user_id ON public.clients(assigned_to_user_id);

-- Création de la table client_interactions
CREATE TABLE public.client_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'note', 'linkedin')),
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary TEXT NOT NULL,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.client_interactions IS 'Historique des interactions avec les clients.';

-- Création des index pour la table client_interactions
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_user_id ON public.client_interactions(user_id);
CREATE INDEX idx_client_interactions_interaction_date ON public.client_interactions(interaction_date);

-- Ajout de la colonne client_id à la table projects
ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.projects.client_id IS 'ID du client associé à ce projet.';
CREATE INDEX idx_projects_client_id ON public.projects(client_id);

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER set_clients_timestamp
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_client_interactions_timestamp
    BEFORE UPDATE ON public.client_interactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies pour la table clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert clients they create"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Assigned users or creators can update clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (auth.uid() = assigned_to_user_id OR auth.uid() = created_by_user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    WITH CHECK (auth.uid() = assigned_to_user_id OR auth.uid() = created_by_user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Creators or admins can delete/archive clients"
    ON public.clients FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by_user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- RLS Policies pour la table client_interactions
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage interactions for clients they can access"
    ON public.client_interactions FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id)); 