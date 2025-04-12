import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { getProjects } from '../lib/supabase';
import { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }
    
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Projets</h1>
          <p className="text-moon-gray">Gérez et suivez tous vos projets</p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={16} />}>
          Nouveau projet
        </Button>
      </div>
      
      <div className="mb-8">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un projet..."
            className="w-full bg-deep-space border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white placeholder:text-moon-gray focus:outline-none focus:border-nebula-purple/50"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-moon-gray" />
        </div>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-orbitron text-star-white mb-2">Aucun projet trouvé</h3>
          <p className="text-moon-gray">Essayez d'ajuster votre recherche ou créez un nouveau projet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;