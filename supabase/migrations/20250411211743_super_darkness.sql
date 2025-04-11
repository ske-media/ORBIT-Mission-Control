/*
  # Schema initial pour Orbit Mission Control

  1. New Tables
    - `users` - Table des utilisateurs avec rôles (admin/collaborator)
    - `projects` - Projets de l'agence avec informations
    - `tickets` - Tâches assignées aux projets
    - `inbox_items` - Messages et idées temporaires à trier

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator')) DEFAULT 'collaborator',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly'))
);

-- Inbox items table
CREATE TABLE IF NOT EXISTS inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can view all projects" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can insert projects" 
  ON projects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update projects" 
  ON projects FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view all tickets" 
  ON tickets FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "All users can insert tickets" 
  ON tickets FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update any ticket" 
  ON tickets FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can view all inbox items" 
  ON inbox_items FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "All users can insert inbox items" 
  ON inbox_items FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update their own inbox items" 
  ON inbox_items FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Import initial data
INSERT INTO projects (id, name, description, deadline, client_name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Refonte du site Stellar Tech', 'Modernisation complète du site web avec nouvelles sections produits et blog', '2025-04-15', 'Stellar Tech', '2025-01-10T10:00:00Z', '2025-01-10T10:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'Campagne Lunaire', 'Campagne marketing sur les réseaux sociaux pour le lancement du produit Lunaire', '2025-02-28', 'Cosmétiques Eclipse', '2025-01-05T09:30:00Z', '2025-01-06T14:20:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'Application mobile Nova', 'Développement de l''application mobile pour la startup Nova', '2025-05-20', 'Nova Innovations', '2025-01-02T11:45:00Z', '2025-01-08T16:30:00Z'),
  ('44444444-4444-4444-4444-444444444444', 'Refonte identité visuelle Agence', 'Mise à jour de notre charte graphique et des supports de communication', '2025-03-10', 'Interne', '2024-12-20T08:15:00Z', '2025-01-04T13:10:00Z')
ON CONFLICT (id) DO NOTHING;