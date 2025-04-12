import { useEffect, useState } from 'react';
import { seedSupabaseData, checkDataExists } from '../lib/seedSupabase';

export const useInitializeApp = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if data exists in Supabase
        const dataExists = await checkDataExists();
        
        // If data doesn't exist, seed it
        if (!dataExists) {
          await seedSupabaseData();
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
      } finally {
        setInitializing(false);
      }
    };
    
    initialize();
  }, []);
  
  return { initializing, initialized, error };
};