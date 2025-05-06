import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// --- IMPORTANT ---
// This script performs manual data seeding for development purposes only.
// Ensure you never expose your Service Role Key in production or frontend bundles.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    'Supabase URL (VITE_SUPABASE_URL) and Service Role Key (VITE_SUPABASE_SERVICE_KEY) must be defined in your environment.'
  );
}

// Create an admin client using the Service Role Key
const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * seedSupabaseData
 * Manual data seeding function. Invoke this in a standalone Node.js script after `supabase db reset`.
 */
export const seedSupabaseData = async (): Promise<void> => {
  console.log('🔄 Starting data seeding...');
  try {
    // *****************************
    // Insert your data below
    // Example: Insert a user
    // await supabaseAdmin.from('users').insert([
    //   {
    //     id: '<uuid-1>',
    //     name: 'Admin User',
    //     email: 'admin@example.com',
    //     role: 'admin',
    //   },
    // ]);

    // Example: Insert a project
    // await supabaseAdmin.from('projects').insert([
    //   {
    //     id: '<uuid-2>',
    //     name: 'Projet X',
    //     description: 'Description du projet X',
    //     deadline: '2025-06-30',
    //     client_name: 'Client Y',
    //   },
    // ]);

    // Add additional insert statements for tickets, inbox_items, etc.
    console.log('✅ Data seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
};
