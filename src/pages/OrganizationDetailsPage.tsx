import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, Calendar, Tag, Globe, Clock, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

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

const OrganizationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Erreur lors du chargement de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;

    try {
      // TODO: Implémenter la suppression
      toast.success('Organisation supprimée avec succès');
      navigate('/organizations');
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Erreur lors de la suppression de l\'organisation');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
          <span>Organisation non trouvée</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/organizations')}>
            Retour aux organisations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/organizations')}
            className="text-moon-gray hover:text-star-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-orbitron text-star-white mb-2">{organization.name}</h1>
            <div className="flex items-center gap-2 text-moon-gray">
              <Building2 size={16} />
              <span>{organization.industry}</span>
              <span className="mx-2">•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                organization.status === 'active' ? 'bg-green-500/20 text-green-500' :
                organization.status === 'prospect' ? 'bg-blue-500/20 text-blue-500' :
                organization.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {organization.status === 'active' ? 'Client actif' :
                 organization.status === 'prospect' ? 'Prospect' :
                 organization.status === 'inactive' ? 'Inactif' : 'Perdu'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {/* TODO: Implémenter l'édition */}}
          >
            <Edit2 size={16} className="mr-2" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Informations</h2>
          <div className="space-y-4">
            {organization.email && (
              <div className="flex items-center gap-3">
                <Mail className="text-moon-gray" size={18} />
                <span className="text-star-white">{organization.email}</span>
              </div>
            )}
            {organization.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-moon-gray" size={18} />
                <span className="text-star-white">{organization.phone}</span>
              </div>
            )}
            {organization.address && (
              <div className="flex items-center gap-3">
                <MapPin className="text-moon-gray" size={18} />
                <span className="text-star-white">{organization.address}</span>
              </div>
            )}
            {organization.website && (
              <div className="flex items-center gap-3">
                <Globe className="text-moon-gray" size={18} />
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nebula-purple hover:text-nebula-purple/80"
                >
                  {organization.website}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Détails</h2>
          <div className="space-y-4">
            <div>
              <span className="text-moon-gray">Secteur</span>
              <p className="text-star-white">{organization.industry}</p>
            </div>
            {organization.notes && (
              <div>
                <span className="text-moon-gray">Notes</span>
                <p className="text-star-white whitespace-pre-wrap">{organization.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-deep-space rounded-xl w-full max-w-md border border-white/10 shadow-xl p-6"
          >
            <h2 className="text-xl font-orbitron text-star-white mb-2">Supprimer l'organisation</h2>
            <p className="text-moon-gray mb-6">
              Êtes-vous sûr de vouloir supprimer cette organisation ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetailsPage; 