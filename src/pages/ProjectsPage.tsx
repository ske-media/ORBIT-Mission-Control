import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
// Removed Link import as ProjectCard handles navigation
import { motion } from 'framer-motion';
import { Plus, Search, X, AlertCircle } from 'lucide-react'; // Added AlertCircle
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { getProjects, createProject } from '../lib/supabase'; // Supabase helpers
import { useAuth } from '../contexts/AuthContext'; // Auth context
import { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
// Type for the new project form data (excluding fields set automatically)
type NewProjectData = Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

// Rename component for clarity and convention
const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectData>({ // Use the specific type
    name: '',
    description: '',
    client_name: '',
    deadline: null // Use null for optional fields
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null); // Specific error for creation

  const { user } = useAuth(); // Get authenticated user

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // getProjects should ideally be protected by RLS
      const data = await getProjects();
      setProjects(data || []); // Handle null case
      setFilteredProjects(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des projets :', err);
      setError(`Impossible de charger les projets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed if getProjects is stable

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProjects(projects);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(lowerCaseQuery) ||
      (project.description && project.description.toLowerCase().includes(lowerCaseQuery)) || // Check if description exists
      (project.client_name && project.client_name.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewProject(prev => ({ ...prev, [name]: value || null })); // Set null if value is empty for optional fields like deadline/client
        setCreateError(null); // Clear error on input change
    };

   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setNewProject(prev => ({ ...prev, deadline: e.target.value ? e.target.value : null })); // Store date as string or null
       setCreateError(null);
   };


  // Handle project creation submit
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null); // Reset creation error

    if (!newProject.name?.trim() || !newProject.description?.trim()) {
      setCreateError("Le nom et la description du projet sont requis.");
      return;
    }

    if (!user) {
      setCreateError("Utilisateur non connecté. Impossible de créer le projet.");
      return;
    }

    setCreating(true);

    // Format data for Supabase, including owner_id
    const projectDataToInsert = {
      ...newProject,
      // Ensure deadline is null if empty, otherwise keep as string (Supabase handles conversion)
      deadline: newProject.deadline || null,
      client_name: newProject.client_name || null,
      owner_id: user.id, // Add owner ID
      // created_at/updated_at are handled by DB defaults or triggers now
    };

    try {
      // Use the createProject helper function
      const created = await createProject(projectDataToInsert);

      if (created) {
        // Add to state and close modal
        setProjects(prev => [created, ...prev]);
        // Also update filtered list if search is not active or if it matches
        if (!searchQuery || created.name.toLowerCase().includes(searchQuery.toLowerCase())) {
             setFilteredProjects(prev => [created, ...prev]);
        }
        setShowCreateModal(false);
        // Reset form
        setNewProject({ name: '', description: '', client_name: '', deadline: null });
      } else {
          // Error should have been logged inside createProject
          setCreateError("La création du projet a échoué (vérifiez la console).");
      }
    } catch (err: any) {
      console.error("Erreur lors de la création du projet:", err);
      setCreateError(`Erreur: ${err.message || 'Une erreur inattendue est survenue.'}`);
    } finally {
      setCreating(false);
    }
  };

  // --- TODO: Add Edit/Delete Handlers ---
   const handleEditProject = (project: Project) => {
       console.log("TODO: Implement Edit Project modal/logic for:", project.id);
       alert("Fonctionnalité d'édition de projet non implémentée.");
   };

   const handleDeleteProject = async (projectId: string) => {
       console.log("TODO: Implement Delete Project logic (with confirmation) for:", projectId);
        // if (!window.confirm("Supprimer ce projet et toutes ses tâches associées ? Cette action est irréversible.")) return;
        // try {
        //    // Call a Supabase function or perform cascaded delete if set up
        //    // const { error } = await supabase.from('projects').delete().eq('id', projectId);
        //    // if (error) throw error;
        //    // Remove from state: setProjects(prev => prev.filter(p => p.id !== projectId));
        // } catch (err) { console.error...) }
       alert("Fonctionnalité de suppression de projet non implémentée.");
   };


  // --- Render Logic ---

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        {/* Consistent loading spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
       {error && ( // Display fetch errors
         <div className="mb-6 p-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-3">
           <AlertCircle size={20} />
           <span>{error}</span>
         </div>
       )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Projets</h1>
          <p className="text-moon-gray">Gérez et suivez tous vos projets</p>
        </div>
        <Button
          variant="primary"
          iconLeft={<Plus size={16} />}
          onClick={() => { setShowCreateModal(true); setCreateError(null); }} // Reset error on open
        >
          Nouveau projet
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md"> {/* Limit search bar width */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom, description, client..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-deep-space border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 && !loading && !error ? (
        <div className="text-center py-12 text-moon-gray">
           {searchQuery ? `Aucun projet trouvé pour "${searchQuery}".` : "Vous n'avez accès à aucun projet pour le moment."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }} // Stagger animation slightly
            >
              {/* Pass Edit/Delete handlers down if actions are on the card */}
              <ProjectCard project={project} />
               {/* Example: Add buttons below card if needed
               <div className="mt-2 flex gap-2">
                   <Button size="sm" variant="outline" onClick={() => handleEditProject(project)}>Edit</Button>
                   <Button size="sm" variant="danger" onClick={() => handleDeleteProject(project.id)}>Delete</Button>
               </div>
               */}
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
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-orbitron text-star-white">Nouveau projet</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-moon-gray hover:text-star-white disabled:opacity-50"
                disabled={creating}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-6">
               {createError && ( // Display creation errors inside modal
                 <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2">
                   <AlertCircle size={18} />
                   <span>{createError}</span>
                 </div>
               )}
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="projectName" className="block text-sm text-moon-gray mb-1.5">
                    Nom du projet <span className="text-red-alert">*</span>
                  </label>
                  <input
                    id="projectName"
                    name="name" // Match state key
                    type="text"
                    value={newProject.name}
                    onChange={handleInputChange}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple"
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
                    name="description" // Match state key
                    value={newProject.description}
                    onChange={handleInputChange}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple min-h-[100px] resize-y"
                    placeholder="Description détaillée des objectifs, livrables..."
                    required
                    disabled={creating}
                  />
                </div>
                {/* Client Name Input */}
                <div>
                  <label htmlFor="projectClient" className="block text-sm text-moon-gray mb-1.5">
                    Client
                  </label>
                  <input
                    id="projectClient"
                    name="client_name" // Match state key
                    type="text"
                    value={newProject.client_name || ''} // Handle null
                    onChange={handleInputChange}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple"
                    placeholder="Nom du client (optionnel)"
                    disabled={creating}
                  />
                </div>
                {/* Deadline Input */}
                <div>
                  <label htmlFor="projectDeadline" className="block text-sm text-moon-gray mb-1.5">
                    Deadline
                  </label>
                  <input
                    id="projectDeadline"
                    name="deadline" // Match state key
                    type="date"
                    value={newProject.deadline || ''} // Handle null
                    onChange={handleDateChange} // Use specific handler for date potentially
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple"
                    disabled={creating}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  type="button" // Important: prevent form submission
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  // Basic validation for enabling button
                  disabled={creating || !newProject.name?.trim() || !newProject.description?.trim()}
                >
                  {creating ? 'Création...' : 'Créer le projet'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage; // Export with the correct name