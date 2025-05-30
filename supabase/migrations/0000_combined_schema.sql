-- ============================================================================
-- Fichier de Migration Consolidé pour Orbit Mission Control
-- Fusion des migrations: initial_schema, add_is_public, finalize_user_profile_trigger
-- Exclut les opérations de backfill de données.
-- ============================================================================

-- ============================================================================
-- 1. Création des Tables
-- ============================================================================

-- Table des utilisateurs (étend auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', -- URL par défaut
    role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator')) DEFAULT 'collaborator',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Profils utilisateurs étendus liés à l''authentification Supabase.';

-- Table des Projets
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Déplacé owner_id ici
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    client_name TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE, -- Ajouté depuis 20250422_add_is_public_to_projects.sql
    is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Nouvelle colonne pour l'archivage
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.projects IS 'Détails des projets gérés par l''agence, avec visibilité publique/privée et statut d''archivage.';

-- Table des Membres de Projet (Table de liaison)
CREATE TABLE IF NOT EXISTS public.project_members (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (project_id, user_id) -- Clé primaire composite
);
COMMENT ON TABLE public.project_members IS 'Associe les utilisateurs aux projets avec des rôles spécifiques.';

-- Table des Tickets (Tâches)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- La tâche reste même si l'assigné est supprimé
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    deadline TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.tickets IS 'Tâches spécifiques associées à un projet.';

-- Table des Éléments de l'Inbox
CREATE TABLE IF NOT EXISTS public.inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Si le créateur est supprimé, ses items disparaissent
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- L'item peut survivre à la suppression du projet lié
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.inbox_items IS 'Notes rapides, idées ou demandes à trier plus tard.';

-- Table des Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Notifications supprimées si l'utilisateur l'est
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ticket_assigned', 'ticket_updated', 'project_created', 'project_updated', 'deadline_approaching', 'mention')),
    related_entity TEXT CHECK (related_entity IN ('ticket', 'project', 'inbox_item')),
    related_id UUID, -- Pas de FK ici pour flexibilité (peut référencer différentes tables)
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.notifications IS 'Notifications envoyées aux utilisateurs.';

-- Table des Paramètres de Notification
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE, -- Paramètres supprimés si l'utilisateur l'est
    email_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    browser_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    sound_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    notification_types TEXT[] DEFAULT ARRAY['ticket_assigned', 'deadline_approaching', 'mention']::TEXT[],
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.notification_settings IS 'Préférences de notification par utilisateur.';


-- ============================================================================
-- 2. Création des Index pour la Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public); -- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON public.projects(is_archived);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON public.tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_inbox_items_created_by ON public.inbox_items(created_by);
CREATE INDEX IF NOT EXISTS idx_inbox_items_project_id ON public.inbox_items(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);


-- ============================================================================
-- 3. Activation de Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Fonctions Utilitaires
-- ============================================================================

-- Fonction pour vérifier si un utilisateur est membre d'un projet
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id_param UUID, p_user_id_param UUID) -- Noms de paramètres distincts
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_members AS pm -- Alias pour la table
    WHERE pm.project_id = p_project_id_param -- Utilise le paramètre
      AND pm.user_id = p_user_id_param    -- Utilise le paramètre
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
COMMENT ON FUNCTION public.is_project_member(UUID, UUID) IS 'Vérifie si un utilisateur est membre d''un projet. Paramètres renommés pour clarté.';

-- ============================================================================
-- 5. Définition des Policies RLS
-- ============================================================================

-- Policies pour `users`
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view all users" ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies pour `project_members`
DROP POLICY IF EXISTS "View project members" ON public.project_members;
CREATE POLICY "View project members"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_project_member(project_members.project_id, auth.uid())
  );
COMMENT ON POLICY "View project members" ON public.project_members IS 'Permet à un utilisateur de voir toutes les appartenances (tous les membres) d''un projet SI il est lui-même membre de ce projet.';

DROP POLICY IF EXISTS "Manage project members" ON public.project_members;
CREATE POLICY "Manage project members"
  ON public.project_members FOR ALL -- INSERT, UPDATE, DELETE
  TO authenticated
  USING ( -- Qui peut déclencher l'action ? Le propriétaire du projet.
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_members.project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK ( -- Quelles lignes peuvent être insérées/modifiées ? Celles appartenant à un projet dont l'utilisateur est propriétaire.
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_members.project_id AND p.owner_id = auth.uid()
    )
     -- Les vérifications complexes pour le dernier 'owner' sont retirées ici.
     -- Il faudra les gérer côté application si nécessaire.
  );

-- Policies pour `projects` (inclut is_public et is_archived)
DROP POLICY IF EXISTS "View projects" ON public.projects;
CREATE POLICY "View projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    (projects.is_public OR projects.owner_id = auth.uid() OR public.is_project_member(projects.id, auth.uid()))
    AND (NOT projects.is_archived OR projects.owner_id = auth.uid() OR public.is_project_member(projects.id, auth.uid()))
  );
COMMENT ON POLICY "View projects" IS 'Permet aux utilisateurs authentifiés de voir les projets publics non archivés, ceux dont ils sont propriétaires, ou ceux dont ils sont membres.';

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Project members can update projects" ON public.projects;
CREATE POLICY "Project members can update projects" ON public.projects FOR UPDATE TO authenticated USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor'))
) WITH CHECK (
    auth.uid() = owner_id
    OR NOT (owner_id IS DISTINCT FROM (SELECT p.owner_id FROM public.projects p WHERE p.id = projects.id))
);

DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;
CREATE POLICY "Project owners can delete projects" ON public.projects FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Policies pour `tickets`
DROP POLICY IF EXISTS "View tickets" ON public.tickets;
CREATE POLICY "View tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (
    public.is_project_member(tickets.project_id, auth.uid()) -- Qualifie tickets.project_id
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = tickets.project_id AND p.is_public = true)
);
COMMENT ON POLICY "View tickets" ON public.tickets IS 'Permet aux membres de voir les tickets de leurs projets ou des projets publics.';

DROP POLICY IF EXISTS "Create tickets" ON public.tickets;
CREATE POLICY "Create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = tickets.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor'))
);

DROP POLICY IF EXISTS "Update tickets" ON public.tickets;
CREATE POLICY "Update tickets" ON public.tickets FOR UPDATE TO authenticated USING (
    assignee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = tickets.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor'))
);

DROP POLICY IF EXISTS "Delete tickets" ON public.tickets; -- Ajout Policy DELETE
CREATE POLICY "Delete tickets" ON public.tickets FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = tickets.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor'))
);


-- Policies pour `inbox_items`
DROP POLICY IF EXISTS "View inbox items" ON public.inbox_items;
CREATE POLICY "View inbox items"
  ON public.inbox_items FOR SELECT TO authenticated
  USING (
    auth.uid() = inbox_items.created_by -- Qualifie inbox_items.created_by
    OR (inbox_items.project_id IS NOT NULL AND public.is_project_member(inbox_items.project_id, auth.uid())) -- Qualifie inbox_items.project_id
    OR (inbox_items.project_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = inbox_items.project_id AND p.is_public = true))
);
COMMENT ON POLICY "View inbox items" ON public.inbox_items IS 'Permet aux utilisateurs de voir leurs items ou ceux des projets auxquels ils appartiennent ou qui sont publics.';

DROP POLICY IF EXISTS "Create inbox items" ON public.inbox_items;
CREATE POLICY "Create inbox items"
  ON public.inbox_items FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (project_id IS NULL OR public.is_project_member(project_id, auth.uid()))
);
COMMENT ON POLICY "Create inbox items" ON public.inbox_items IS 'Permet aux utilisateurs de créer des items pour eux-mêmes ou pour les projets dont ils sont membres.';

DROP POLICY IF EXISTS "Update inbox items" ON public.inbox_items;
CREATE POLICY "Update inbox items" ON public.inbox_items FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Delete inbox items" ON public.inbox_items; -- Ajout Policy DELETE
CREATE POLICY "Delete inbox items" ON public.inbox_items FOR DELETE TO authenticated USING (auth.uid() = created_by);


-- Policies pour `notifications`
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies pour `notification_settings`
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
CREATE POLICY "Users can update their own notification settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 6. Fonctions pour les Triggers
-- ============================================================================

-- Fonction pour ajouter automatiquement le créateur comme 'owner' dans project_members
CREATE OR REPLACE FUNCTION public.add_project_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.add_project_owner_as_member() IS 'Trigger function to add the project creator as an owner member.';


-- Fonction pour créer les paramètres de notification par défaut pour un nouvel utilisateur (dans public.users)
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.create_default_notification_settings() IS 'Trigger function to create default notification settings for new users when their public profile is created.';


-- Fonction pour créer le profil public.users lors de l'insertion dans auth.users
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Nouvel Utilisateur'), -- Fournit un nom par défaut
      NEW.email,
      'collaborator' -- Rôle par défaut
      -- created_at utilise DEFAULT now()
  )
  ON CONFLICT (id) DO NOTHING; -- Ne fait rien si le profil existe déjà
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.create_user_profile() IS 'Trigger function to automatically create a public user profile when a new user signs up in auth.users.';


-- ============================================================================
-- 7. Création des Triggers
-- ============================================================================

-- Trigger pour ajouter l'owner comme membre lors de la création d'un projet
DROP TRIGGER IF EXISTS trigger_add_project_owner ON public.projects;
CREATE TRIGGER trigger_add_project_owner
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.add_project_owner_as_member();

-- Trigger pour créer les settings de notif par défaut lors de la création d'un profil public.users
DROP TRIGGER IF EXISTS trigger_create_default_settings ON public.users;
CREATE TRIGGER trigger_create_default_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_settings();

-- Trigger pour créer le profil public.users lors de l'insertion dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;
CREATE TRIGGER on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();


-- ============================================================================
-- 8. (Optionnel) Données initiales de seeding (Commenté)
--    NE PAS INCLURE DANS LA MIGRATION AUTOMATIQUE. A exécuter manuellement.
-- ============================================================================
/*
-- Backfill pour un utilisateur spécifique (exemple, à adapter avec le vrai ID Auth)
-- INSERT INTO public.users (id, name, email, role)
-- SELECT
--   id,
--   COALESCE(raw_user_meta_data->>'name', 'Utilisateur Existant'),
--   email,
--   'collaborator' -- ou 'admin' si besoin
-- FROM auth.users
-- WHERE id = 'VOTRE_USER_AUTH_ID_ICI' -- <--- METTRE LE VRAI ID
-- ON CONFLICT (id) DO UPDATE SET -- Met à jour si le profil existe déjà mais manque des infos
--   name = EXCLUDED.name,
--   email = EXCLUDED.email;
*/

-- ============================================================================
-- Fin de la migration consolidée
-- ============================================================================