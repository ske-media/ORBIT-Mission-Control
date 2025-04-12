import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { users, projects, tickets, inboxItems } from '../data/mockData';
import { Database } from '../types/supabase';

// Map to store the mapping between old IDs and new UUIDs
const idMappings = {
  users: new Map<string, string>(),
  projects: new Map<string, string>(),
  tickets: new Map<string, string>(),
};

// Check if the tables have data
export const checkDataExists = async (): Promise<boolean> => {
  try {
    // Check if projects table has data
    const { count: projectCount, error: projectError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
      
    if (projectError) throw projectError;
    
    // If we have projects, assume data is already seeded
    return (projectCount || 0) > 0;
  } catch (error) {
    console.error('Error checking if data exists:', error);
    return false;
  }
};

// Seed user data
const seedUsers = async () => {
  console.log('Seeding users data...');
  
  try {
    // First check if we have a real user to preserve
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'ebb394df-676e-477c-9920-dc3c99c8e474')
      .limit(1);
    
    // Generate UUID mappings for users
    users.forEach(user => {
      // Don't override the existing user if it exists
      if (existingUser && existingUser.length > 0 && user.id === '1') {
        idMappings.users.set(user.id, 'ebb394df-676e-477c-9920-dc3c99c8e474');
      } else {
        idMappings.users.set(user.id, uuidv4());
      }
    });
    
    // Prepare user data for insertion
    const userData = users.map(user => {
      const newId = idMappings.users.get(user.id);
      
      // Skip the existing user if it exists
      if (existingUser && existingUser.length > 0 && user.id === '1') {
        return null;
      }
      
      return {
        id: newId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        created_at: new Date().toISOString()
      };
    }).filter(Boolean); // Remove null entries
    
    // Insert users (if any to insert)
    if (userData.length > 0) {
      const { error } = await supabase.from('users').insert(userData);
      if (error) throw error;
    }
    
    console.log('Users data seeded successfully');
  } catch (error) {
    console.error('Error seeding users data:', error);
  }
};

// Seed project data
const seedProjects = async () => {
  console.log('Seeding projects data...');
  
  try {
    // Generate UUID mappings for projects
    projects.forEach(project => {
      idMappings.projects.set(project.id, uuidv4());
    });
    
    // Prepare project data for insertion
    const projectData = projects.map(project => {
      const newId = idMappings.projects.get(project.id);
      
      return {
        id: newId,
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        client_name: project.clientName,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      };
    });
    
    // Insert projects
    const { error } = await supabase.from('projects').insert(projectData);
    if (error) throw error;
    
    console.log('Projects data seeded successfully');
  } catch (error) {
    console.error('Error seeding projects data:', error);
  }
};

// Seed ticket data
const seedTickets = async () => {
  console.log('Seeding tickets data...');
  
  try {
    // Generate UUID mappings for tickets
    tickets.forEach(ticket => {
      idMappings.tickets.set(ticket.id, uuidv4());
    });
    
    // Prepare ticket data for insertion
    const ticketData = tickets.map(ticket => {
      const newId = idMappings.tickets.get(ticket.id);
      const newProjectId = idMappings.projects.get(ticket.projectId);
      const newAssigneeId = ticket.assigneeId ? idMappings.users.get(ticket.assigneeId) : null;
      
      return {
        id: newId,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority.toLowerCase(),
        status: ticket.status.toLowerCase(),
        project_id: newProjectId,
        assignee_id: newAssigneeId,
        deadline: ticket.deadline,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
        is_recurring: ticket.isRecurring || false,
        recurring_frequency: ticket.recurringFrequency || null
      };
    });
    
    // Insert tickets
    const { error } = await supabase.from('tickets').insert(ticketData);
    if (error) throw error;
    
    console.log('Tickets data seeded successfully');
  } catch (error) {
    console.error('Error seeding tickets data:', error);
  }
};

// Seed inbox items
const seedInboxItems = async () => {
  console.log('Seeding inbox items data...');
  
  try {
    // Prepare inbox item data for insertion
    const inboxItemData = inboxItems.map(item => {
      const newId = uuidv4();
      const newProjectId = item.projectId ? idMappings.projects.get(item.projectId) : null;
      const newCreatedBy = idMappings.users.get(item.createdBy) || 'ebb394df-676e-477c-9920-dc3c99c8e474';
      
      return {
        id: newId,
        content: item.content,
        project_id: newProjectId,
        created_at: item.createdAt,
        created_by: newCreatedBy
      };
    });
    
    // Insert inbox items
    const { error } = await supabase.from('inbox_items').insert(inboxItemData);
    if (error) throw error;
    
    console.log('Inbox items data seeded successfully');
  } catch (error) {
    console.error('Error seeding inbox items data:', error);
  }
};

// Main function to seed all data
export const seedSupabaseData = async () => {
  console.log('Starting data seeding process...');
  
  // Check if data already exists
  const dataExists = await checkDataExists();
  
  if (dataExists) {
    console.log('Data already exists in Supabase, skipping seeding.');
    return;
  }
  
  // Seed data in the correct order (respecting foreign key constraints)
  await seedUsers();
  await seedProjects();
  await seedTickets();
  await seedInboxItems();
  
  console.log('Data seeding complete!');
};