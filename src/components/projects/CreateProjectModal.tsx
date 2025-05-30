import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { createProject } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ClientSelector } from '../clients/ClientSelector';

type ProjectType = Database['public']['Tables']['projects']['Row'];
type NewProjectData = {
  name: string;
  description: string;
  client_id: string | null;
  deadline: string | null;
  is_public: boolean;
};

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: ProjectType) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [newProject, setNewProject] = useState<NewProjectData>({
    name: '',
    description: '',
    client_id: null,
    deadline: null,
    is_public: false
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setNewProject(prev => ({ ...prev, [name]: checked }));
    } else {
      const finalValue = (name === 'deadline') && value === '' ? null : value;
      setNewProject(prev => ({ ...prev, [name]: finalValue }));
    }

    setError(null);
  };

  const handleClientChange = (clientId: string | null) => {
    setNewProject(prev => ({ ...prev, client_id: clientId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newProject.name?.trim() || !newProject.description?.trim()) {
      setError("Le nom et la description du projet sont requis.");
      return;
    }

    setCreating(true);

    try {
      const created = await createProject({
        name: newProject.name,
        description: newProject.description,
        client_id: newProject.client_id,
        is_public: newProject.is_public || false,
      });

      onProjectCreated(created);
      onClose();
      setNewProject({ name: '', description: '', client_id: null, deadline: null, is_public: false });
    } catch (err) {
      console.error("Erreur lors de la création du projet:", err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-deep-space rounded-xl w-full max-w-lg border border-white/10 shadow-xl"
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-orbitron text-star-white">Nouveau projet</h2>
          <button
            onClick={() => !creating && onClose()}
            className="text-moon-gray hover:text-star-white disabled:opacity-50"
            disabled={creating}
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="projectName" className="block text-sm text-moon-gray mb-1.5">
                Nom du projet <span className="text-red-alert">*</span>
              </label>
              <input
                id="projectName"
                name="name"
                type="text"
                value={newProject.name}
                onChange={handleInputChange}
                className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                placeholder="ex: Refonte site web V2"
                required
                disabled={creating}
              />
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="projectDesc" className="block text-sm text-moon-gray mb-1.5">
                Description <span className="text-red-alert">*</span>
              </label>
              <textarea
                id="projectDesc"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 min-h-[100px] resize-y ${creating ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                placeholder="Description détaillée des objectifs, livrables..."
                required
                disabled={creating}
              />
            </div>

            {/* Client Selector */}
            <div>
              <label htmlFor="projectClient" className="block text-sm text-moon-gray mb-1.5">
                Client
              </label>
              <ClientSelector
                value={newProject.client_id}
                onChange={handleClientChange}
              />
            </div>

            {/* Deadline Input */}
            <div>
              <label htmlFor="projectDeadline" className="block text-sm text-moon-gray mb-1.5">
                Date limite
              </label>
              <input
                id="projectDeadline"
                name="deadline"
                type="date"
                value={newProject.deadline || ''}
                onChange={handleInputChange}
                className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                disabled={creating}
              />
            </div>

            {/* Public Project Toggle */}
            <div className="flex items-center justify-between pt-2">
              <label htmlFor="isPublic" className="text-sm text-moon-gray">
                Projet Public ?
                <span className="block text-xs text-moon-gray/70">Visible par tous les utilisateurs authentifiés.</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="isPublic"
                  name="is_public"
                  type="checkbox"
                  className="sr-only peer"
                  checked={newProject.is_public || false}
                  onChange={handleInputChange}
                  disabled={creating}
                />
                <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer ${creating ? 'cursor-wait' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple`}></div>
              </label>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={creating || !newProject.name?.trim() || !newProject.description?.trim()}
            >
              {creating ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProjectModal; 