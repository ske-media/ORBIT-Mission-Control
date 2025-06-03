import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, Calendar, Tag, Globe, Clock, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import { getOrganization, Organization } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const OrganizationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await getOrganization(id);
        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast.error('Erreur lors du chargement de l\'organisation');
        setError(error instanceof Error ? error.message : 'Impossible de charger l\'organisation.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id]);

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

  if (error || !organization) {
    return (
      <div className="p-8 text-center">
        <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
          <span>{error || 'Organisation non trouvée'}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-deep-space rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-orbitron text-star-white mb-4">Description</h2>
            <p className="text-moon-gray">
              {organization.description || 'Aucune description disponible.'}
            </p>
          </div>

          {/* Contacts */}
          <div className="bg-deep-space rounded-xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-orbitron text-star-white">Contacts</h2>
              <Button
                variant="ghost"
                onClick={() => {/* TODO: Implémenter l'ajout de contact */}}
              >
                <Users size={16} className="mr-2" />
                Ajouter un contact
              </Button>
            </div>
            {organization.contacts && organization.contacts.length > 0 ? (
              <div className="space-y-4">
                {organization.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start justify-between p-4 bg-space-black rounded-lg border border-white/5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-orbitron text-star-white">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.is_primary && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-nebula-purple/20 text-nebula-purple">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-moon-gray">
                        <span>{contact.role}</span>
                        {contact.email && (
                          <>
                            <span>•</span>
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 hover:text-star-white"
                            >
                              <Mail size={14} />
                              {contact.email}
                            </a>
                          </>
                        )}
                        {contact.phone && (
                          <>
                            <span>•</span>
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1 hover:text-star-white"
                            >
                              <Phone size={14} />
                              {contact.phone}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implémenter l'édition du contact */}}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implémenter la suppression du contact */}}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-moon-gray">
                Aucun contact associé à cette organisation.
              </div>
            )}
          </div>

          {/* Projets */}
          <div className="bg-deep-space rounded-xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-orbitron text-star-white">Projets</h2>
              <Button
                variant="ghost"
                onClick={() => {/* TODO: Implémenter l'ajout de projet */}}
              >
                <Calendar size={16} className="mr-2" />
                Nouveau projet
              </Button>
            </div>
            {organization.projects && organization.projects.length > 0 ? (
              <div className="space-y-4">
                {organization.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-space-black rounded-lg border border-white/5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-orbitron text-star-white mb-1">{project.title}</h3>
                        <p className="text-sm text-moon-gray mb-2">{project.description}</p>
                        <div className="flex items-center gap-4 text-sm text-moon-gray">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>
                              {new Date(project.start_date).toLocaleDateString()} - 
                              {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'En cours'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            project.status === 'active' ? 'bg-green-500/20 text-green-500' :
                            project.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                            project.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {project.status === 'active' ? 'En cours' :
                             project.status === 'completed' ? 'Terminé' :
                             project.status === 'on_hold' ? 'En pause' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-moon-gray">
                Aucun projet associé à cette organisation.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations de contact */}
          <div className="bg-deep-space rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-orbitron text-star-white mb-4">Informations de contact</h2>
            <div className="space-y-4">
              {organization.website && (
                <div className="flex items-center gap-2 text-moon-gray">
                  <Globe size={16} />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-star-white"
                  >
                    {organization.website}
                  </a>
                </div>
              )}
              {organization.location && (
                <div className="flex items-center gap-2 text-moon-gray">
                  <MapPin size={16} />
                  <span>
                    {[
                      organization.location.address,
                      organization.location.city,
                      organization.location.country
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {organization.timezone && (
                <div className="flex items-center gap-2 text-moon-gray">
                  <Clock size={16} />
                  <span>{organization.timezone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {organization.tags && organization.tags.length > 0 && (
            <div className="bg-deep-space rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-orbitron text-star-white mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {organization.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-sm bg-nebula-purple/20 text-nebula-purple"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="bg-deep-space rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-orbitron text-star-white mb-4">Historique</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nebula-purple mt-2"></div>
                <div>
                  <p className="text-sm text-star-white">Organisation créée</p>
                  <p className="text-xs text-moon-gray">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {organization.updated_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-nebula-purple mt-2"></div>
                  <div>
                    <p className="text-sm text-star-white">Dernière modification</p>
                    <p className="text-xs text-moon-gray">
                      {new Date(organization.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
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