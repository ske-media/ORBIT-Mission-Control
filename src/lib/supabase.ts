import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Types
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Proposal = Database['public']['Tables']['proposals']['Row'];
export type Interaction = Database['public']['Tables']['interactions']['Row'];
export type OrganizationProject = Database['public']['Tables']['organization_projects']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];

// Organization functions
export const getOrganizations = async (): Promise<Organization[]> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createOrganization = async (organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .insert([organization])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Contact functions
export const createContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([contact])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Client functions
export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getClient = async (id: string): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Proposal functions
export const createProposal = async (proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> => {
  const { data, error } = await supabase
    .from('proposals')
    .insert([proposal])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Interaction functions
export const createInteraction = async (interaction: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>): Promise<Interaction> => {
  const { data, error } = await supabase
    .from('interactions')
    .insert([interaction])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Project functions
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members(user_id, role),
      clients(id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  return data || [];
};

export const getOrganizationProjects = async (organizationId: string): Promise<OrganizationProject[]> => {
  const { data, error } = await supabase
    .from('organization_projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createProject = async (project: Omit<OrganizationProject, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationProject> => {
  const { data, error } = await supabase
    .from('organization_projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createOrganizationProject = async (project: Omit<OrganizationProject, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationProject> => {
  const { data, error } = await supabase
    .from('organization_projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;
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

// Ticket functions
export const createTicket = async (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTicketAssignees = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('ticket_assignees')
    .select(`
      *,
      users (
        id,
        email,
        full_name
      )
    `)
    .eq('ticket_id', ticketId);

  if (error) throw error;
  return data || [];
};

export const addTicketAssignee = async (ticketId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_assignees')
    .insert([{ ticket_id: ticketId, user_id: userId }]);

  if (error) throw error;
};

export const removeTicketAssignee = async (ticketId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_assignees')
    .delete()
    .eq('ticket_id', ticketId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getTicketsByProject = async (projectId: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Notification functions
export const getUnreadNotificationsCount = async (): Promise<number> => {
  const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
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

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      ...notification,
      is_read: false
    }]);

  if (error) throw error;
};

// User functions
export const getCurrentUserProfile = async () => {
  const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

// Project functions
export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members(user_id, role),
      clients(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
  return data;
};

export const getProjectMembers = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      users (
        id,
        email,
        full_name
      )
    `)
    .eq('project_id', projectId);

  if (error) throw error;
  return data || [];
};

export type ProjectMemberWithUser = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    full_name: string;
  };
};

export const deleteOrganizationProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('organization_projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
};

export const getArchivedProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members(user_id, role),
      clients(id, name)
    `)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching archived projects:', error);
    throw error;
  }
  return data || [];
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
    console.error('Erreur lors de la désarchivage du projet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la désarchivage du projet' };
  }
}; 