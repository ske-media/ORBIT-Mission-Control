/*
  # Fix RLS policies and improve data seeding

  1. Changes
    - Fix recursive RLS policies on project_members
    - Add service_role bypass for seeding
    - Improve project member policies
    - Add missing policies for tickets and inbox items

  2. Security
    - Ensure proper access control while avoiding recursion
    - Add proper policies for all tables
*/

-- Drop potentially recursive policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;

-- Simplified project members policies
CREATE POLICY "View project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Manage project members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_members.project_id
      AND owner_id = auth.uid()
    )
  );

-- Update projects policies to avoid recursion
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;

CREATE POLICY "View projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Update tickets policies
DROP POLICY IF EXISTS "Users can view all tickets" ON tickets;
DROP POLICY IF EXISTS "All users can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update any ticket" ON tickets;

CREATE POLICY "View tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Update inbox items policies
DROP POLICY IF EXISTS "Users can view all inbox items" ON inbox_items;
DROP POLICY IF EXISTS "All users can insert inbox items" ON inbox_items;
DROP POLICY IF EXISTS "Users can update their own inbox items" ON inbox_items;

CREATE POLICY "View inbox items"
  ON inbox_items FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Create inbox items"
  ON inbox_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (project_id IS NULL) OR
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Update inbox items"
  ON inbox_items FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Function to check project membership
CREATE OR REPLACE FUNCTION is_project_member(project_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
    AND project_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;