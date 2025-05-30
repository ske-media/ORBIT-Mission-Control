import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, RefreshCw, Loader2 } from 'lucide-react';
import { getArchivedProjects, unarchiveProject } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

type ProjectType = Database['public']['Tables']['projects']['Row'];

interface ArchivedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUnarchived: () => void;
}

const ArchivedProjectsModal: React.FC<ArchivedProjectsModalProps> = ({
  isOpen,
  onClose,
  onProjectUnarchived,
}) => {
  const [archivedProjects, setArchivedProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchArchivedProjects();
    }
  }, [isOpen]);

  const fetchArchivedProjects = async () => {
    setLoading(true);
    try {
      const projects = await getArchivedProjects();
      setArchivedProjects(projects);
    } catch (error) {
      console.error('Erreur lors du chargement des projets archivés:', error);
      toast.error('Erreur lors du chargement des projets archivés');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (projectId: string) => {
    if (unarchivingId) return;
    setUnarchivingId(projectId);
    try {
      const result = await unarchiveProject(projectId);
      if (result.success) {
        setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
        toast.success('Projet désarchivé avec succès');
        onProjectUnarchived();
      } else {
        toast.error(result.error || 'Erreur lors de la désarchivation');
      }
    } catch (error) {
      console.error('Erreur lors de la désarchivation:', error);
      toast.error('Erreur lors de la désarchivation du projet');
    } finally {
      setUnarchivingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-space-black border border-white/10 rounded-lg p-6 w-full max-w-2xl shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Archive className="text-nebula-purple" size={24} />
            <h2 className="text-xl font-semibold text-star-white">Projets Archivés</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-moon-gray hover:text-star-white"
          >
            <X size={20} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-nebula-purple" size={24} />
          </div>
        ) : archivedProjects.length === 0 ? (
          <p className="text-center text-moon-gray py-8">Aucun projet archivé</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-deep-space rounded-lg border border-white/5"
              >
                <div>
                  <h3 className="text-star-white font-medium">{project.name}</h3>
                  <p className="text-sm text-moon-gray mt-1">{project.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnarchive(project.id)}
                  disabled={!!unarchivingId}
                  className="text-nebula-purple hover:text-nebula-purple/80"
                >
                  {unarchivingId === project.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArchivedProjectsModal; 