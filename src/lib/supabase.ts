import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { User as AuthUser } from '@supabase/supabase-js'; // Importe le type User d'authentification

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

// Initialize the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Type alias pour plus de clarté
type UserProfile = Database['public']['Tables']['users']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];
type InboxItem = Database['public']['Tables']['inbox_items']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationSettings = Database['public']['Tables']['notification_settings']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'];

export type ProjectMemberWithUser = ProjectMember & {
  user: UserProfile;
};

type ProjectType = Database['public']['Tables']['projects']['Row'];

// ==================================
// Auth Helpers
// ==================================
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user session:', error.message);
    return null;
  }
  return user;
};

// ==================================
// Users Table Helpers
// ==================================
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error(`Error fetching user by ID (${userId}):`, error);
    throw error;
  }
  return data;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated. Cannot fetch profile.");

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`User profile not found for auth user id: ${user.id}.`);
      return null;
    }
    console.error('Error fetching current user profile:', error);
    throw error;
  }
  return data;
};

// ==================================
// Projects Table Helpers
// ==================================
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`*, project_members(user_id, role)`) // Inclure membres est utile
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  return data || [];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`*, project_members(user_id, role)`)
    .eq('id', id)
    .single();
  if (error) {
    console.error(`Error fetching project by ID (${id}):`, error);
    throw error;
  }
  return data;
};

export const createProject = async (
    project: Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'owner_id' | 'created_at' | 'updated_at'>
): Promise<Project> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated. Cannot create project.');

  const { data, error } = await supabase
    .from('projects')
    .insert([{ ...project, owner_id: user.id }])
    .select()
    .single();
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  return data;
};

export const updateProject = async (id: string, projectUpdates: Partial<Project>): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...projectUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error(`Error updating project (${id}):`, error);
    throw error;
  }
  return data;
};

// ==================================
// Project Members Table Helpers -- NOUVEAU / MODIFIÉ
// ==================================
export const getProjectMembers = async (projectId: string): Promise<ProjectMemberWithUser[]> => {
  console.log('Début getProjectMembers pour le projet:', projectId);
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('project_id', projectId);
  if (error) {
    console.error(`Error fetching project members for project (${projectId}):`, error);
    throw error;
  }
  console.log('Membres récupérés avec succès:', data);
  return data || [];
};

export const addProjectMember = async (projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<ProjectMember | null> => {
  const { data, error } = await supabase
    .from('project_members')
    .insert([{ project_id: projectId, user_id: userId, role }])
    .select()
    .single();
  if (error) {
    console.error(`Error adding project member (user: ${userId}, project: ${projectId}):`, error);
    throw error;
  }
  return data;
};

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  newRole: 'owner' | 'editor' | 'viewer'
): Promise<{ success: boolean; error?: string }> {
  console.log('Début updateProjectMemberRole:', { projectId, userId, newRole });
  
  try {
    // Vérifier si l'utilisateur actuel est le propriétaire du projet
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Erreur lors de la vérification du propriétaire:', projectError);
      return { success: false, error: 'Erreur lors de la vérification des permissions' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== projectData.owner_id) {
      console.error('L\'utilisateur n\'est pas le propriétaire du projet');
      return { success: false, error: 'Seul le propriétaire peut modifier les rôles' };
    }

    // Vérifier si le membre existe
    const { data: memberData, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (memberError) {
      console.error('Erreur lors de la vérification du membre:', memberError);
      return { success: false, error: 'Membre non trouvé' };
    }

    // Mettre à jour le rôle
    const { data, error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      return { success: false, error: error.message };
    }

    console.log('Rôle mis à jour avec succès:', data);
    return { success: true };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

export const removeProjectMember = async (projectId: string, userId: string): Promise<boolean> => {
  const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
  if (projectError) throw projectError;
  if (projectData?.owner_id === userId) throw new Error("Project owner cannot be removed.");

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .neq('role', 'owner');
  if (error) {
    console.error(`Error removing member (${userId}) from project (${projectId}):`, error);
    throw error;
  }
  return true;
};

export const getUsersToInvite = async (projectId: string, searchTerm: string = ""): Promise<UserProfile[]> => {
  const { data: membersData, error: membersError } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId);
  if (membersError) throw membersError;
  const existingMemberIds = membersData?.map(m => m.user_id) || [];

  // Ensure the array is not empty before using 'in' filter, otherwise it causes an error
  const memberIdsFilter = existingMemberIds.length > 0 ? `(${existingMemberIds.join(',')})` : '(null)';

  let query = supabase
    .from('users')
    .select('*')
    .not('id', 'in', memberIdsFilter);

  if (searchTerm.trim()) {
      query = query.or(`name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`);
  }

  const { data, error } = await query.limit(10);
  if (error) {
    console.error('Error fetching users to invite:', error);
    throw error;
  }
  return data || [];
};


// ==================================
// Tickets Table Helpers
// ==================================
export const getTicketsByProject = async (projectId: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error(`Error fetching tickets for project (${projectId}):`, error);
    throw error;
  }
  return data || [];
};

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error(`Error fetching ticket by ID (${id}):`, error);
    throw error;
  }
  return data;
};

export const createTicket = async (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{ ...ticket }])
    .select()
    .single();
  if (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
  return data;
};

export const updateTicket = async (id: string, ticketUpdates: Partial<Ticket>): Promise<Ticket | null> => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ ...ticketUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error(`Error updating ticket (${id}):`, error);
    throw error;
  }
  return data;
};

// ==================================
// Inbox Items Table Helpers
// ==================================
export const getInboxItems = async (): Promise<InboxItem[]> => {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching inbox items:', error);
    throw error;
  }
  return data || [];
};

export const createInboxItem = async (item: Omit<InboxItem, 'id' | 'created_by' | 'created_at'>): Promise<InboxItem> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated. Cannot create inbox item.');

  const { data, error } = await supabase
    .from('inbox_items')
    .insert([{ ...item, created_by: user.id }])
    .select()
    .single();
  if (error) {
    console.error('Error creating inbox item:', error);
    throw error;
  }
  return data;
};

// ==================================
// Statistics Helpers
// ==================================
// Note: Consider moving complex aggregations to DB functions/views for better performance/RLS handling

export const getProjectCompletion = async (projectId: string): Promise<number> => {
  const tickets = await getTicketsByProject(projectId); // This respects RLS on tickets
  if (tickets.length === 0) return 0;
  const completedTickets = tickets.filter(ticket => ticket.status === 'done').length;
  return Math.round((completedTickets / tickets.length) * 100);
};

export const getUrgentTicketsCount = async (projectId: string): Promise<number> => {
  // Assumes RLS on tickets allows counting for project members
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('priority', 'high')
    .neq('status', 'done');
  if (error) {
    console.error(`Error counting urgent tickets for project (${projectId}):`, error);
    throw error;
  }
  return count || 0;
};

// ... (autres fonctions stats si besoin)

// ==================================
// Notifications & Settings Helpers
// ==================================
// ... (getNotifications, getUnreadNotificationsCount, markNotificationAsRead, etc. - PAS DE CHANGEMENTS MAJEURS REQUIS ICI a priori) ...

// Garde les fonctions de notification et settings telles quelles, elles semblent correctes.
// Juste s'assurer qu'elles utilisent .single() et throw error comme les autres.

export const getNotifications = async (limit = 20): Promise<Notification[]> => {
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
    throw error;
  }
  return data || [];
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) {
    console.error('Error counting unread notifications:', error);
    throw error;
  }
  return count || 0;
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();
  if (error) {
    console.error(`Error marking notification (${notificationId}) as read:`, error);
    throw error;
  }
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
  return true;
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ ...notification }]) // is_read defaults to false
    .select()
    .single();
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  return data;
};

export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");
  const userProfile = await getCurrentUserProfile(); // Vérifie que le profil public existe
  if (!userProfile) throw new Error(`User profile does not exist, cannot fetch settings.`);

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`Notification settings not found for user ${user.id}. Check DB trigger.`);
      return null; // Le trigger devrait s'en charger
    }
    console.error('Error fetching notification settings:', error);
    throw error;
  }
  return data;
};

export const updateNotificationSettings = async (settingsUpdates: Partial<NotificationSettings>): Promise<NotificationSettings | null> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");

  const { data, error } = await supabase
    .from('notification_settings')
    .update({ ...settingsUpdates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
  return data;
};

export const archiveProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'archivage du projet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de l\'archivage du projet' };
  }
};

export const unarchiveProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la désarchivation du projet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la désarchivation du projet' };
  }
};

export const getArchivedProjects = async (): Promise<ProjectType[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des projets archivés:', error);
    throw error;
  }
};

export const addTicketAssignee = async (ticketId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_assignees')
    .insert([{ ticket_id: ticketId, user_id: userId }]);
  
  if (error) {
    console.error(`Error adding ticket assignee (user: ${userId}, ticket: ${ticketId}):`, error);
    throw error;
  }
};

export const removeTicketAssignee = async (ticketId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_assignees')
    .delete()
    .match({ ticket_id: ticketId, user_id: userId });
  
  if (error) {
    console.error(`Error removing ticket assignee (user: ${userId}, ticket: ${ticketId}):`, error);
    throw error;
  }
};

export const getTicketAssignees = async (ticketId: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('ticket_assignees')
    .select(`
      user:users(*)
    `)
    .eq('ticket_id', ticketId);

  if (error) {
    console.error(`Error getting ticket assignees (ticket: ${ticketId}):`, error);
    throw error;
  }

  return data.map(item => item.user);
};