import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

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

const ContactDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to match our Contact interface
      const transformedContact = {
        ...data,
        organization_name: data.organization?.name || 'Sans organisation'
      };
      
      setContact(transformedContact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Erreur lors du chargement du contact');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-nebula-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-orbitron text-star-white mb-4">Contact non trouvé</h2>
          <Button onClick={() => navigate('/clients')}>Retour aux clients</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="text-moon-gray hover:text-star-white"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">
            {contact.first_name} {contact.last_name}
          </h1>
          <p className="text-moon-gray">{contact.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Informations</h2>
          <div className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="text-moon-gray" size={18} />
                <span className="text-star-white">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-moon-gray" size={18} />
                <span className="text-star-white">{contact.phone}</span>
              </div>
            )}
            {contact.organization_name && (
              <div className="flex items-center gap-3">
                <Building2 className="text-moon-gray" size={18} />
                <span className="text-star-white">{contact.organization_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Détails</h2>
          <div className="space-y-4">
            <div>
              <span className="text-moon-gray">Langue préférée</span>
              <p className="text-star-white">
                {contact.preferred_language === 'FR' ? 'Français' : 'English'}
              </p>
            </div>
            {contact.notes && (
              <div>
                <span className="text-moon-gray">Notes</span>
                <p className="text-star-white whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsPage; 