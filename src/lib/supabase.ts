import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};

// Users
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .limit(1);

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Projects
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data;
};

export const getProjectById = async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .limit(1);

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const createProject = async (project: Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      ...project,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const updateProject = async (id: string, project: Partial<Database['public']['Tables']['projects']['Update']>) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...project,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Tickets
export const getTicketsByProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  return data;
};

export const getTicketById = async (id: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .limit(1);

  if (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const createTicket = async (ticket: Omit<Database['public']['Tables']['tickets']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      ...ticket,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('Error creating ticket:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const updateTicket = async (id: string, ticket: Partial<Database['public']['Tables']['tickets']['Update']>) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      ...ticket,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating ticket:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Inbox
export const getInboxItems = async () => {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inbox items:', error);
    return [];
  }

  return data;
};

export const createInboxItem = async (item: Omit<Database['public']['Tables']['inbox_items']['Insert'], 'id' | 'created_at'>) => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('inbox_items')
    .insert([{
      ...item,
      created_by: user.id,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('Error creating inbox item:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Statistics
export const getProjectCompletion = async (projectId: string) => {
  const tickets = await getTicketsByProject(projectId);
  if (tickets.length === 0) return 0;
  
  const completedTickets = tickets.filter(ticket => ticket.status === 'done').length;
  return Math.round((completedTickets / tickets.length) * 100);
};

export const getUrgentTicketsCount = async (projectId: string) => {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('priority', 'high')
    .neq('status', 'done');

  if (error) {
    console.error('Error counting urgent tickets:', error);
    return 0;
  }

  return count || 0;
};

export const getInboxItemsByProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inbox items by project:', error);
    return [];
  }

  return data;
};

// Notifications
export const getNotifications = async (limit = 10) => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data;
};

export const getUnreadNotificationsCount = async () => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }

  return count || 0;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();

  if (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const markAllNotificationsAsRead = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
};

export const createNotification = async (notification: Omit<Database['public']['Tables']['notifications']['Insert'], 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      ...notification,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Notification Settings
export const getNotificationSettings = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  // First check if user profile exists in the users table
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) {
    console.error('User profile does not exist in users table');
    return null;
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .limit(1);

  if (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }

  // If no settings exists yet, create default settings
  if (!data || data.length === 0) {
    return createDefaultNotificationSettings(user.id);
  }

  return data[0];
};

export const createDefaultNotificationSettings = async (userId: string) => {
  // First check if user exists in the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    console.error('Error checking user existence or user does not exist:', userError);
    return null;
  }
  
  const { data, error } = await supabase
    .from('notification_settings')
    .insert([{
      user_id: userId,
      email_notifications: true,
      browser_notifications: true,
      sound_enabled: true,
      notification_types: ['ticket_assigned', 'deadline_approaching', 'mention'],
      updated_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('Error creating notification settings:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const updateNotificationSettings = async (settings: Partial<Database['public']['Tables']['notification_settings']['Update']>) => {
  const user = await getCurrentUser();
  if (!user) return null;

  // First, check if settings exist
  const existingSettings = await getNotificationSettings();
  
  // If no settings exist, create them first
  if (!existingSettings) {
    return createDefaultNotificationSettings(user.id);
  }

  // Update existing settings
  const { data, error } = await supabase
    .from('notification_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating notification settings:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};