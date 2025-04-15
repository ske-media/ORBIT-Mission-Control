import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Calendar, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        
        // Fetch tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('*');

        if (ticketsError) throw ticketsError;

        setProjects(projectsData || []);
        setTickets(ticketsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate dashboard statistics
  const activeProjects = projects.length;
  const urgentTasks = tickets.filter(ticket => 
    ticket.priority === 'high' && ticket.status !== 'done'
  ).length;
  const completedTasks = tickets.filter(ticket => ticket.status === 'done').length;
  const totalTasks = tickets.length;
  
  // Upcoming deadlines (projects with deadlines in the next 7 days)
  const upcomingDeadlines = projects.filter(project => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Tableau de bord</h1>
        <p className="text-moon-gray">Vue d'ensemble de tous vos projets et tâches</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div 
          className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-12 h-12 rounded-full bg-nebula-purple/20 flex items-center justify-center mr-4">
            <Rocket size={24} className="text-nebula-purple" />
          </div>
          <div>
            <p className="text-moon-gray text-sm">Projets actifs</p>
            <h3 className="text-2xl font-orbitron text-star-white">{activeProjects}</h3>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-red-alert/20 flex items-center justify-center mr-4">
            <AlertTriangle size={24} className="text-red-alert" />
          </div>
          <div>
            <p className="text-moon-gray text-sm">Tâches urgentes</p>
            <h3 className="text-2xl font-orbitron text-star-white">{urgentTasks}</h3>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full bg-green-success/20 flex items-center justify-center mr-4">
            <CheckCircle size={24} className="text-green-success" />
          </div>
          <div>
            <p className="text-moon-gray text-sm">Tâches complétées</p>
            <h3 className="text-2xl font-orbitron text-star-white">{completedTasks}/{totalTasks}</h3>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-12 h-12 rounded-full bg-yellow-warning/20 flex items-center justify-center mr-4">
            <Calendar size={24} className="text-yellow-warning" />
          </div>
          <div>
            <p className="text-moon-gray text-sm">Deadlines proches</p>
            <h3 className="text-2xl font-orbitron text-star-white">{upcomingDeadlines}</h3>
          </div>
        </motion.div>
      </div>
      
      {/* Mini radar chart placeholder - will be implemented later */}
      <motion.div 
        className="bg-deep-space p-6 rounded-xl border border-white/10 mb-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-orbitron text-star-white">Activité de la semaine</h2>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
              <Users size={16} className="text-nebula-purple" />
            </div>
            <span className="ml-2 text-moon-gray">4 membres actifs</span>
          </div>
        </div>
        
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="text-moon-gray mb-4">Radar d'activité</div>
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
              <div className="absolute inset-[15%] rounded-full border-2 border-white/5"></div>
              <div className="absolute inset-[30%] rounded-full border-2 border-white/5"></div>
              <div className="absolute inset-[45%] rounded-full border-2 border-white/5"></div>
              <div className="absolute w-4 h-4 bg-nebula-purple rounded-full top-12 left-2 animate-pulse"></div>
              <div className="absolute w-3 h-3 bg-galaxy-blue rounded-full top-5 right-5 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute w-3 h-3 bg-yellow-warning rounded-full bottom-7 right-6 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute w-2 h-2 bg-green-success rounded-full bottom-3 left-8 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-orbitron text-star-white">Projets en cours</h2>
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

export default DashboardPage;