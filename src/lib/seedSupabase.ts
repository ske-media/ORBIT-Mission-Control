import { createClient } from '@supabase/supabase-js'; // <--- Added missing import
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../types/supabase';

// --- IMPORTANT ---
// Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY are correctly set
// in your .env file and are being loaded by Vite.
// The Service Role Key bypasses Row Level Security - DO NOT expose it in frontend bundles for production.
// Using it here is generally safe for a local development seeding script.
// NEVER COMMIT YOUR SERVICE ROLE KEY TO VERSION CONTROL.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    'Supabase URL and Service Key (VITE_SUPABASE_SERVICE_KEY) must be defined in .env for seeding'
  );
}

// Create a separate client for seeding using the Service Role Key
const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
  // Use auth options suitable for server-side or admin tasks
  auth: {
    // Prevent saving session data to localStorage when using service key client-side
    persistSession: false,
    // No need to auto-refresh tokens for service key
    autoRefreshToken: false,
    // No need to detect session from URL for service key operations
    detectSessionInUrl: false,
  },
});

// Map to store the mapping between old mockData IDs and new UUIDs
const idMappings = {
  users: new Map<string, string>(),
  projects: new Map<string, string>(),
  tickets: new Map<string, string>(),
};

// Check if the tables have data using the admin client
export const checkDataExists = async (): Promise<boolean> => {
  console.log('Checking if data exists using admin client...');
  try {
    // Check a core table like projects
    const { count: projectCount, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectError) {
      console.error('Supabase error during data check:', projectError);
      throw projectError; // Re-throw to indicate failure
    }

    const exists = (projectCount || 0) > 0;
    console.log(`Data check complete. Projects exist: ${exists}`);
    return exists;
  } catch (error) {
    // Log the caught error object directly for more details
    console.error('Error checking if data exists:', error);
    // Assume data doesn't exist or check failed, proceed with caution
    return false;
  }
};

// Seed user data using the admin client
const seedUsers = async () => {
  console.log('Seeding users data...');
  try {
    // First check if we have a real user to preserve
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id') // Only select id, no need for '*'
      .eq('id', 'ebb394df-676e-477c-9920-dc3c99c8e474') // Example preserved ID
      .limit(1);

    if (fetchError) throw fetchError;

    const userExistsToPreserve = existingUser && existingUser.length > 0;

    // Generate UUID mappings for users
    users.forEach(user => {
      // Preserve the specific user if found
      if (userExistsToPreserve && user.id === '1') {
        // Use the actual ID found in the database for consistency
        idMappings.users.set(user.id, existingUser[0].id);
      } else {
        idMappings.users.set(user.id, uuidv4());
      }
    });

    // Prepare user data for insertion
    const userDataToInsert = users
      .map(user => {
        // Skip the user if it's the one being preserved
        if (userExistsToPreserve && user.id === '1') {
          return null;
        }

        const newId = idMappings.users.get(user.id);
        if (!newId) return null; // Should not happen, but safe check

        return {
          id: newId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          created_at: new Date().toISOString(), // Let DB handle default if preferred
        };
      })
      .filter((user): user is NonNullable<typeof user> => user !== null); // Type guard filter

    // Insert users (if any new users to insert)
    if (userDataToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert(userDataToInsert);
      if (insertError) throw insertError;
    }

    console.log('Users data seeded successfully');
  } catch (error) {
    console.error('Error seeding users data:', error);
    throw error; // Re-throw to stop the seeding process if users fail
  }
};

// Seed project data using the admin client
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
      if (!newId) return null; // Safety check

      return {
        id: newId,
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        client_name: project.clientName,
        created_at: project.createdAt, // Or let DB handle default
        updated_at: project.updatedAt, // Or let DB handle default
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    // Insert projects
    if (projectData.length > 0) {
      const { error } = await supabaseAdmin.from('projects').insert(projectData);
      if (error) throw error;
    }

    console.log('Projects data seeded successfully');
  } catch (error) {
    console.error('Error seeding projects data:', error);
    throw error; // Re-throw to stop if projects fail (needed for FKs)
  }
};

// Seed ticket data using the admin client
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
      // IMPORTANT: Ensure project ID from mock data exists in our mapping
      const newProjectId = ticket.projectId ? idMappings.projects.get(ticket.projectId) : null;
      // IMPORTANT: Ensure assignee ID from mock data exists in our mapping
      const newAssigneeId = ticket.assigneeId ? idMappings.users.get(ticket.assigneeId) : null;

      // Skip if project ID mapping failed (project might not be in mockData or mapping failed)
      if (!newProjectId) {
        console.warn(`Skipping ticket "${ticket.title}" due to missing project mapping for mock ID ${ticket.projectId}`);
        return null;
      }

      return {
        id: newId,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority.toLowerCase(),
        status: ticket.status.toLowerCase(),
        project_id: newProjectId, // Use the mapped UUID
        assignee_id: newAssigneeId, // Use the mapped UUID or null
        deadline: ticket.deadline,
        created_at: ticket.createdAt, // Or let DB handle default
        updated_at: ticket.updatedAt, // Or let DB handle default
        // Ensure these fields exist in your 'tickets' table schema
        is_recurring: ticket.isRecurring ?? false, // Provide default if optional
        recurring_frequency: ticket.recurringFrequency ?? null, // Provide default if optional
      };
    }).filter((t): t is NonNullable<typeof t> => t !== null);

    // Insert tickets
    if (ticketData.length > 0) {
      const { error } = await supabaseAdmin.from('tickets').insert(ticketData);
      // Log detailed error if it's a foreign key violation
      if (error && error.code === '23503') {
         console.error(`Foreign Key Violation seeding tickets: ${error.message}. Details: ${error.details}. Hint: ${error.hint}. Ensure referenced projects/users were seeded correctly.`);
      }
      if (error) throw error;
    }

    console.log('Tickets data seeded successfully');
  } catch (error) {
    console.error('Error seeding tickets data:', error);
    throw error; // Re-throw
  }
};

// Seed inbox items using the admin client
const seedInboxItems = async () => {
  console.log('Seeding inbox items data...');
  try {
    // Prepare inbox item data for insertion
    const inboxItemData = inboxItems.map(item => {
      const newId = uuidv4();
      // Map project ID if it exists
      const newProjectId = item.projectId ? idMappings.projects.get(item.projectId) : null;
      // Map creator ID, fall back to a known existing ID if needed/desired
      const fallbackUserId = idMappings.users.get('1') || 'ebb394df-676e-477c-9920-dc3c99c8e474'; // Use mapped ID of user '1' or the hardcoded preserved ID
      const newCreatedBy = item.createdBy ? idMappings.users.get(item.createdBy) || fallbackUserId : fallbackUserId;

      // If item has a project ID but mapping failed, warn and potentially skip or insert without project_id
       if (item.projectId && !newProjectId) {
         console.warn(`Inbox item "${item.content.substring(0,20)}..." has mock project ID ${item.projectId}, but no mapping found. Inserting without project link.`);
         // return null; // Option 1: Skip entirely
       }

      return {
        id: newId,
        content: item.content,
        // Only include project_id if it was successfully mapped
        project_id: item.projectId ? newProjectId : null,
        created_at: item.createdAt, // Or let DB handle default
        created_by: newCreatedBy, // Ensure this user ID exists
      };
    }).filter((i): i is NonNullable<typeof i> => i !== null);

    // Insert inbox items
    if (inboxItemData.length > 0) {
      const { error } = await supabaseAdmin.from('inbox_items').insert(inboxItemData);
       if (error && error.code === '23503') {
         console.error(`Foreign Key Violation seeding inbox items: ${error.message}. Details: ${error.details}. Hint: ${error.hint}. Ensure referenced projects/users were seeded correctly.`);
      }
      if (error) throw error;
    }

    console.log('Inbox items data seeded successfully');
  } catch (error) {
    console.error('Error seeding inbox items data:', error);
    throw error; // Re-throw
  }
};

// Main function to seed all data, ensuring order
export const seedSupabaseData = async () => {
  console.log('Starting data seeding process...');
  try {
    // Check if data already exists using the admin client
    const dataExists = await checkDataExists();

    if (dataExists) {
      console.log('Data already exists in Supabase (checked via admin client), skipping seeding.');
      return;
    }

    console.log('Seeding required. Proceeding with admin client...');
    // Seed data in the correct order (respecting foreign key constraints)
    await seedUsers();      // Needs to run first
    await seedProjects();   // Needs users (potentially for owner/creator FKs later), needed by tickets/inbox
    await seedTickets();    // Depends on users (assignee) and projects
    await seedInboxItems(); // Depends on users (creator) and projects

    console.log('--- Data seeding complete! ---');

  } catch (error) {
    // Catch errors from individual seed functions if they re-throw
    console.error('!!! Data seeding process failed:', error);
    console.error('!!! Please check the error messages above. Common issues include incorrect Service Role Key, RLS policies blocking inserts even for admin (unlikely but possible), or Foreign Key violations if seeding order is wrong or data is inconsistent.');
  }
};