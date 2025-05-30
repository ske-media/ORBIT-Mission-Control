import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, RefreshCw, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { getArchivedProjects, unarchiveProject } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

type ProjectType = Database['public']['Tables']['projects']['Row'];

type SortField = 'created_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedProjects = archivedProjects
    .filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0;
    });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-deep-space rounded-xl p-6 w-full max-w-4xl shadow-xl border border-white/10"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Archive className="text-nebula-purple" size={24} />
            <h2 className="text-xl font-orbitron text-star-white">Projets Archivés</h2>
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

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, description, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-space-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
          />
        </div>

        {/* En-têtes de tri */}
        <div className="grid grid-cols-12 gap-4 mb-4 text-sm text-moon-gray border-b border-white/10 pb-2">
          <div className="col-span-5">
            <button
              onClick={() => handleSort('created_at')}
              className="flex items-center gap-1 hover:text-star-white"
            >
              Date de création
              {sortField === 'created_at' && (
                sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </button>
          </div>
          <div className="col-span-5">
            <button
              onClick={() => handleSort('updated_at')}
              className="flex items-center gap-1 hover:text-star-white"
            >
              Date d'archivage
              {sortField === 'updated_at' && (
                sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </button>
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-nebula-purple" size={24} />
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <p className="text-center text-moon-gray py-8">
            {searchQuery ? `Aucun projet archivé trouvé pour "${searchQuery}"` : "Aucun projet archivé"}
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {filteredAndSortedProjects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-12 gap-4 items-center p-4 bg-space-black rounded-lg border border-white/5"
              >
                <div className="col-span-5">
                  <h3 className="text-star-white font-medium">{project.name}</h3>
                  <p className="text-sm text-moon-gray mt-1">{project.description}</p>
                </div>
                <div className="col-span-5">
                  <div className="text-sm text-moon-gray">
                    <div>Créé le {formatDate(project.created_at)}</div>
                    <div>Archivé le {formatDate(project.updated_at)}</div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnarchive(project.id)}
                    disabled={!!unarchivingId}
                    className="text-nebula-purple hover:text-nebula-purple/80 whitespace-nowrap inline-flex items-center"
                  >
                    {unarchivingId === project.id ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : (
                      <RefreshCw className="mr-2" size={16} />
                    )}
                    Désarchiver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArchivedProjectsModal; 