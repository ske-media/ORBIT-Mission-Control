/*
  # Add notifications functionality

  1. New Tables
    - `notifications` - Stores all notifications for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `content` (text) - notification message
      - `type` (text) - type of notification (e.g., ticket_assigned, deadline_approaching, etc.)
      - `related_entity` (text) - type of related entity (ticket, project, etc.)
      - `related_id` (uuid) - reference to the related entity
      - `is_read` (boolean) - whether notification has been read
      - `created_at` (timestamp)
    
    - `notification_settings` - User preferences for notifications
      - `user_id` (uuid, primary key, references users)
      - `email_notifications` (boolean) - enable/disable email notifications
      - `browser_notifications` (boolean) - enable/disable browser notifications
      - `sound_enabled` (boolean) - enable/disable notification sounds
      - `notification_types` (text[]) - array of notification types to receive
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ticket_assigned', 'ticket_updated', 'project_created', 'project_updated', 'deadline_approaching', 'mention')),
  related_entity TEXT CHECK (related_entity IN ('ticket', 'project', 'inbox_item')),
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  browser_notifications BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  notification_types TEXT[] DEFAULT ARRAY['ticket_assigned', 'deadline_approaching', 'mention']::TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification settings
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to create default notification settings for new users
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default notification settings for new users
CREATE TRIGGER create_notification_settings_for_new_user
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_settings();

-- Insert some sample notifications for testing (will only be added if the tables are empty)
DO $$
BEGIN
  -- Only insert if there are no notifications yet
  IF NOT EXISTS (SELECT 1 FROM notifications LIMIT 1) THEN
    -- Get some user IDs from the users table
    WITH user_data AS (
      SELECT id FROM users LIMIT 3
    )
    INSERT INTO notifications (user_id, content, type, related_entity, related_id, created_at)
    SELECT 
      id, 
      'Thomas vous a assigné une nouvelle tâche', 
      'ticket_assigned', 
      'ticket', 
      (SELECT id FROM tickets LIMIT 1), 
      now() - interval '2 hours'
    FROM user_data
    LIMIT 1;

    WITH user_data AS (
      SELECT id FROM users LIMIT 3
    )
    INSERT INTO notifications (user_id, content, type, related_entity, related_id, created_at)
    SELECT 
      id, 
      'La deadline du projet Stellar Tech approche dans 3 jours', 
      'deadline_approaching', 
      'project', 
      (SELECT id FROM projects LIMIT 1), 
      now() - interval '1 day'
    FROM user_data
    LIMIT 1;

    WITH user_data AS (
      SELECT id FROM users LIMIT 3
    )
    INSERT INTO notifications (user_id, content, type, related_entity, related_id, created_at)
    SELECT 
      id, 
      'Julie vous a mentionné dans un commentaire', 
      'mention', 
      'ticket', 
      (SELECT id FROM tickets LIMIT 1), 
      now() - interval '30 minutes'
    FROM user_data
    LIMIT 1;
  END IF;
END;
$$;