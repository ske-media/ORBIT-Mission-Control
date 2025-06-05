import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Users } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { CreateOrganizationModal } from '@/components/organizations/CreateOrganizationModal';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { OrganizationList } from '@/components/organizations/OrganizationList';
import { ContactList } from '@/components/contacts/ContactList';
import { supabase } from '@/lib/supabase';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  industry: string;
  website: string;
  notes: string;
  created_at: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  organization_id: string;
  organization_name: string;
  preferred_language: 'FR' | 'EN';
  notes: string;
  created_at: string;
}

const ClientPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === '/organizations') {
      navigate('/clients');
      return;
    }
    fetchOrganizations();
    fetchContacts();
  }, [location.pathname, navigate]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erreur lors du chargement des organisations');
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Contact interface
      const transformedContacts = data?.map(contact => ({
        ...contact,
        organization_name: contact.organization?.name || 'Sans organisation'
      })) || [];
      
      setContacts(transformedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationClick = (organization: Organization) => {
    navigate(`/clients/organizations/${organization.id}`);
  };

  const handleContactClick = (contact: Contact) => {
    navigate(`/clients/contacts/${contact.id}`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Clients</h1>
          <p className="text-moon-gray">Gérez vos organisations et contacts</p>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-deep-space p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-space-black focus:outline-none focus:ring-2',
                selected
                  ? 'bg-nebula-purple text-star-white shadow'
                  : 'text-moon-gray hover:bg-white/[0.12] hover:text-star-white'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 size={16} />
              Organisations
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-space-black focus:outline-none focus:ring-2',
                selected
                  ? 'bg-nebula-purple text-star-white shadow'
                  : 'text-moon-gray hover:bg-white/[0.12] hover:text-star-white'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={16} />
              Contacts
            </div>
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setShowCreateOrgModal(true)}
                className="bg-nebula-purple hover:bg-nebula-purple/90"
              >
                <Plus size={16} className="mr-2" />
                Nouvelle organisation
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-nebula-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <OrganizationList
                organizations={organizations}
                onOrganizationClick={handleOrganizationClick}
              />
            )}
          </Tab.Panel>

          <Tab.Panel>
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setShowCreateContactModal(true)}
                className="bg-nebula-purple hover:bg-nebula-purple/90"
              >
                <Plus size={16} className="mr-2" />
                Nouveau contact
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-nebula-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ContactList
                contacts={contacts}
                onContactClick={handleContactClick}
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        onOrganizationCreated={() => {
          setShowCreateOrgModal(false);
          fetchOrganizations();
          toast.success('Organisation créée avec succès !');
        }}
      />

      <CreateContactModal
        isOpen={showCreateContactModal}
        onClose={() => setShowCreateContactModal(false)}
        onContactCreated={() => {
          setShowCreateContactModal(false);
          fetchContacts();
          toast.success('Contact créé avec succès !');
        }}
      />
    </div>
  );
};

export default ClientPage; 