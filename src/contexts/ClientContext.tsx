import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Organization, Contact } from '../types/crm';

interface ClientContextType {
  organizations: Organization[];
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  addOrganization: (org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateOrganization: (id: string, org: Partial<Organization>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addOrganization = async (org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('organizations')
        .insert([org]);

      if (error) throw error;
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contacts')
        .insert([contact]);

      if (error) throw error;
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (id: string, org: Partial<Organization>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('organizations')
        .update(org)
        .eq('id', id);

      if (error) throw error;
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, contact: Partial<Contact>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id);

      if (error) throw error;
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientContext.Provider
      value={{
        organizations,
        contacts,
        loading,
        error,
        fetchOrganizations,
        fetchContacts,
        addOrganization,
        addContact,
        updateOrganization,
        updateContact,
        deleteOrganization,
        deleteContact,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
} 