import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, AlertCircle, ArchiveRestore } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { getProjects, createProject, archiveProject } from '../lib/supabase'; // Supabase helpers, createProject throws now
import { useAuth } from '../contexts/AuthContext'; // Auth context
import { Database } from '../types/supabase';
import ArchivedProjectsModal from '../components/projects/ArchivedProjectsModal';

type Project = Database['public']['Tables']['projects']['Row'];
// Type for the new project form data (excluding fields set automatically)
type NewProjectData = Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // --- State for Loading/Error/Success ---
  const [loading, setLoading] = useState(true); // Loading initial project list
  const [error, setError] = useState<string | null>(null); // Error for initial project list
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectData>({
    name: '',
    description: '',
    client_name: '',
    deadline: null, // Use null for optional date/string fields
    is_public: false // Initialize new fields if needed
  });
  const [creating, setCreating] = useState(false); // Loading state for project creation
  const [createError, setCreateError] = useState<string | null>(null); // Error state for project creation
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const { user } = useAuth(); // Get authenticated user

  // --- Fetch Projects ---
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      // Filtrer les projets archivés
      const activeProjects = data?.filter(project => !project.is_archived) || [];
      setProjects(activeProjects);
      setFilteredProjects(activeProjects);
    } catch (err) {
      console.error('Erreur lors de la récupération des projets :', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Filter Projects ---
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProjects(projects);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(lowerCaseQuery) ||
      (project.description && project.description.toLowerCase().includes(lowerCaseQuery)) ||
      (project.client_name && project.client_name.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // --- Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle checkbox specifically
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setNewProject(prev => ({ ...prev, [name]: checked }));
    } else {
        // Set null for empty optional text/date fields
        const finalValue = (name === 'client_name' || name === 'deadline') && value === '' ? null : value;
        setNewProject(prev => ({ ...prev, [name]: finalValue }));
    }

    setCreateError(null); // Clear error on input change
  };

  // Handle project creation submit
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null); // Reset creation error

    if (!newProject.name?.trim() || !newProject.description?.trim()) {
      setCreateError("Le nom et la description du projet sont requis.");
      return;
    }
    if (!user) { // Should not happen if page is protected, but safe check
      setCreateError("Utilisateur non connecté. Reconnectez-vous.");
      return;
    }

    setCreating(true); // Start creation loading state

    // Prepare data for insertion (owner_id is now added inside createProject helper)
    const projectDataToInsert: NewProjectData = {
      name: newProject.name,
      description: newProject.description,
      client_name: newProject.client_name || null, // Ensure null if empty
      deadline: newProject.deadline || null,     // Ensure null if empty
      is_public: newProject.is_public || false,  // Ensure boolean
    };

    try {
      // createProject throws on error
      const created = await createProject(projectDataToInsert);

      // If successful:
      setProjects(prev => [created, ...prev]); // Update full list
      // Update filtered list only if it matches current filter or no filter active
      if (!searchQuery || created.name.toLowerCase().includes(searchQuery.toLowerCase())) {
           setFilteredProjects(prev => [created, ...prev]);
      }
      setShowCreateModal(false); // Close modal
      // Reset form state
      setNewProject({ name: '', description: '', client_name: '', deadline: null, is_public: false });

    } catch (err) { // Catch error from createProject
      console.error("Erreur lors de la création du projet:", err);
      setCreateError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.'); // Set creation error state
    } finally {
      setCreating(false); // End creation loading state
    }
  };

  const handleProjectArchived = useCallback(() => {
    fetchProjects(); // Rafraîchir la liste des projets
  }, [fetchProjects]);

  // --- Placeholder Handlers ---
   const handleEditProject = (project: Project) => {
       console.log("TODO: Implement Edit Project modal/logic for:", project.id);
       alert("Fonctionnalité d'édition de projet non implémentée.");
   };

   const handleDeleteProject = async (projectId: string) => {
       console.log("TODO: Implement Delete Project logic (with confirmation) for:", projectId);
       alert("Fonctionnalité de suppression de projet non implémentée.");
   };


  // --- Render Logic ---

  // 1. Handle Initial Loading State
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  // 2. Handle Initial Error State
  if (error) {
    return (
        <div className="p-8 text-center">
             <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
               <AlertCircle size={32} />
               <span>{error}</span>
                {/* Add a retry button */}
                <Button variant="outline" size="sm" onClick={fetchProjects}>
                  Réessayer
                </Button>
             </div>
        </div>
    );
  }

  // 3. Render Page Content (if no initial loading or error)
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Projets</h1>
          <p className="text-moon-gray">Gérez et suivez tous vos projets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchivedModal(true)}
            className="text-moon-gray hover:text-star-white"
          >
            <ArchiveRestore size={18} className="mr-2" />
            Projets Archivés
          </Button>
          <Button
            variant="primary"
            iconLeft={<Plus size={16} />}
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
          >
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom, description, client..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-deep-space border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
        />
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-moon-gray">
           {searchQuery ? `Aucun projet trouvé pour "${searchQuery}".` : "Vous n'avez accès à aucun projet pour le moment ou aucun projet n'a été créé."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <ProjectCard 
                project={project} 
                onProjectArchived={handleProjectArchived}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
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
                onClick={() => !creating && setShowCreateModal(false)} // Prevent closing while creating
                className="text-moon-gray hover:text-star-white disabled:opacity-50"
                disabled={creating} // Disable close button while creating
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProjectSubmit} className="p-6">
               {/* Display creation error */}
               {createError && (
                 <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm">
                   <AlertCircle size={18} />
                   <span>{createError}</span>
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
                    disabled={creating} // Disable input while creating
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
                    disabled={creating} // Disable input while creating
                  />
                </div>
                {/* Client Name Input */}
                <div>
                  <label htmlFor="projectClient" className="block text-sm text-moon-gray mb-1.5">
                    Client
                  </label>
                  <input
                    id="projectClient"
                    name="client_name"
                    type="text"
                    value={newProject.client_name || ''}
                    onChange={handleInputChange}
                    className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                    placeholder="Nom du client (optionnel)"
                    disabled={creating} // Disable input while creating
                  />
                </div>
                {/* Deadline Input */}
                <div>
                  <label htmlFor="projectDeadline" className="block text-sm text-moon-gray mb-1.5">
                    Deadline
                  </label>
                  <input
                    id="projectDeadline"
                    name="deadline"
                    type="date"
                    value={newProject.deadline || ''}
                    onChange={handleInputChange} // Utilise le même handler
                    className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                    disabled={creating} // Disable input while creating
                  />
                </div>
                 {/* Is Public Toggle */}
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
                  onClick={() => setShowCreateModal(false)}
                  type="button"
                  disabled={creating} // Disable cancel button while creating
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  // Disable submit button while creating or if required fields are empty
                  disabled={creating || !newProject.name?.trim() || !newProject.description?.trim()}
                >
                  {creating ? 'Création...' : 'Créer le projet'} {/* Change button text while creating */}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Archived Projects Modal */}
      <ArchivedProjectsModal
        isOpen={showArchivedModal}
        onClose={() => setShowArchivedModal(false)}
        onProjectUnarchived={fetchProjects}
      />
    </div>
  );
};

export default ProjectsPage;