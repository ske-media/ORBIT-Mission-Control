import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { projects } from '../data/mockData';

const ProjectsPage: React.FC = () => {
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
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-moon-gray" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
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
    </div>
  );
};

export default ProjectsPage;