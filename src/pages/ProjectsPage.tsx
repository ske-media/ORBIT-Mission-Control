import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { getProjects, createProject } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_name: '',
    deadline: ''
  });
  const [creating, setCreating] = useState(false);

  // Récupération de l'utilisateur authentifié
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
        setFilteredProjects(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des projets :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifie la présence d'un nom et d'une description
    if (!newProject.name.trim() || !newProject.description.trim()) return;

    // Vérifie si l'utilisateur est bien connecté pour récupérer son ID
    if (!user) {
      alert("Aucun utilisateur connecté. Veuillez vous connecter.");
      return;
    }

    // Prépare les données pour la création du projet en incluant owner_id
    const projectData = {
      ...newProject,
      owner_id: user.id, // Ajoute l'ID de l'utilisateur connecté
      // Optionnel : ajouté des timestamps si nécessaire
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let errorMessage = null;

    try {
      setCreating(true);
      const project = await createProject(projectData);

      if (!project) {
        errorMessage = 'Échec de la création du projet';
      } else {
        setProjects([project, ...projects]);
        setFilteredProjects([project, ...filteredProjects]);
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          client_name: '',
          deadline: ''
        });
      }
    } catch (error) {
      console.error("Erreur inattendue :", error);
      errorMessage = 'Une erreur inattendue est survenue';
    } finally {
      setCreating(false);
      if (errorMessage) {
        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nebula-purple"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Projets</h1>
          <p className="text-moon-gray">Gérez et suivez tous vos projets</p>
        </div>
        <Button 
          variant="primary" 
          iconLeft={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Nouveau projet
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-moon-gray" size={20} />
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full bg-space-black border border-white/10 rounded-lg pl-12 pr-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-moon-gray">Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            className="bg-deep-space rounded-xl w-full max-w-lg border border-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-orbitron text-star-white">Nouveau projet</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                disabled={creating || !newProject.name.trim() || !newProject.description.trim()}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-moon-gray mb-2">
                    Nom du projet <span className="text-red-alert">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                    placeholder="ex: Refonte site web"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-moon-gray mb-2">
                    Description <span className="text-red-alert">*</span>
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple min-h-[100px]"
                    placeholder="Description détaillée du projet..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-moon-gray mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    value={newProject.client_name}
                    onChange={e => setNewProject({ ...newProject, client_name: e.target.value })}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                    placeholder="Nom du client (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm text-moon-gray mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateModal(false)}
                  type="button"
                >
                  Annuler
                </Button>
                <Button 
                  variant="primary"
                  type="submit"
                  disabled={creating || !newProject.name.trim() || !newProject.description.trim()}
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

export default Projects;