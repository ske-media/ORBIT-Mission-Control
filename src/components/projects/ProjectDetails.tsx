import React, { useState } from 'react';
import { Archive, Loader2 } from 'lucide-react';
import { archiveProject } from '../../lib/supabase';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { Database } from '../../types/supabase';
import ConfirmModal from '../ui/ConfirmModal';
import { Project } from "../../lib/supabase";

type ProjectType = Database['public']['Tables']['projects']['Row'];

interface ProjectDetailsProps {
  project: ProjectType;
  onProjectArchived?: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onProjectArchived,
}) => {
  const [isArchiving, setIsArchiving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleArchive = async () => {
    if (!project || isArchiving) return;
    setIsArchiving(true);
    try {
      const result = await archiveProject(project.id);
      if (result.success) {
        toast.success('Projet archivé avec succès');
        onProjectArchived?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'archivage du projet');
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      toast.error('Erreur lors de l\'archivage du projet');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-orbitron text-star-white">{project?.name}</h1>
          {project?.is_archived && (
            <span className="px-2 py-1 text-xs bg-yellow-warning/20 text-yellow-warning rounded-full">
              Archivé
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!project?.is_archived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={isArchiving}
              className="text-red-alert/70 hover:text-red-alert hover:bg-red-alert/10"
            >
              {isArchiving ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Archive size={18} className="mr-2" />
              )}
              Archiver
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleArchive}
        title="Archiver le projet"
        message={`Êtes-vous sûr de vouloir archiver le projet "${project.name}" ?`}
        confirmText="Archiver"
        variant="danger"
      />
    </>
  );
};

export default ProjectDetails; 