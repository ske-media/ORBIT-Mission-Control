import React, { createContext, useContext, useEffect, useState } from 'react';
// Importe AuthError pour une meilleure gestion des erreurs Supabase
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Ajoute le type de retour pour signIn et signUp
type AuthResponse = {
  data: { user: User | null; session: Session | null; } | null;
  error: AuthError | null;
} | {
  data: { user: User | null; }; // Pour signUp qui ne retourne pas de session directement
  error: AuthError | null;
};


type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // error: Error | null; // On peut enlever l'erreur globale du contexte si gérée localement
  signIn: (email: string, password: string) => Promise<AuthResponse>; // Modifie le type de retour
  signUp: (email: string, password: string, name: string) => Promise<AuthResponse>; // Modifie le type de retour
  signOut: () => Promise<{ error: AuthError | null }>; // Ajoute aussi un type de retour pour signOut
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null); // On peut commenter ou supprimer

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Peut-être ajuster le loading ici aussi
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    // setError(null); // Réinitialise si tu gardes l'erreur globale
    try {
      // Retourne directement le résultat de Supabase
      const response = await supabase.auth.signInWithPassword({ email, password });
      // Log pour le debug si besoin
      console.log("AuthContext signIn response:", response);
      // Si l'erreur est gérée ici, on peut commenter le throw de LoginPage
      // if (response.error) {
      //   setError(response.error);
      // }
      return response;
    } catch (error) {
       // Ce catch est pour des erreurs imprévues, pas les erreurs d'authentification standard
       console.error("Unexpected error in signIn:", error);
       // setError(error as Error);
       // Retourne une structure d'erreur cohérente si nécessaire
       return { data: null, error: error instanceof AuthError ? error : new AuthError(error instanceof Error ? error.message : 'Unknown signIn error') };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    setLoading(true);
    // setError(null); // Réinitialise si tu gardes l'erreur globale
    try {
      // Retourne directement le résultat de Supabase
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
       console.log("AuthContext signUp response:", response);

      // Le trigger SQL gère la création du profil public.users
      // Pas besoin d'attendre ici avec setTimeout

      // Si l'erreur est gérée ici, on peut commenter le throw de LoginPage
      // if (response.error) {
      //   setError(response.error);
      // }
      return response;
    } catch (error) {
       console.error("Unexpected error in signUp:", error);
       // setError(error as Error);
       return { data: null, error: error instanceof AuthError ? error : new AuthError(error instanceof Error ? error.message : 'Unknown signUp error') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    // setError(null);
    try {
      // Retourne directement le résultat
      const response = await supabase.auth.signOut();
      // if (response.error) {
      //   setError(response.error);
      // }
      return response;
    } catch (error) {
       console.error("Unexpected error in signOut:", error);
       // setError(error as Error);
       return { error: error instanceof AuthError ? error : new AuthError(error instanceof Error ? error.message : 'Unknown signOut error') };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    // error, // Tu peux choisir de garder ou non l'état d'erreur global
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};