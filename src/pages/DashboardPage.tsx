import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Calendar, AlertTriangle, CheckCircle, Users, AlertCircle as AlertCircleError } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to potentially get user specific data later

type Project = Database['public']['Tables']['projects']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];
type User = Database['public']['Tables']['users']['Row'];

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembersCount, setTeamMembersCount] = useState<number | null>(null); // Example for dynamic stat

  // const { user } = useAuth(); // Get user if needed for filtering later

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error on new fetch
      try {
        // Fetch projects (RLS should filter these)
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        setProjects(projectsData || []);

        // Fetch tickets (RLS should filter these ideally, or filter client-side based on project access)
        // WARNING: Selecting ALL tickets might be inefficient/insecure without RLS on tickets table.
        // Consider fetching tickets only for the visible projects if performance becomes an issue.
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, project_id, priority, status, assignee_id'); // Fetch only needed fields

        if (ticketsError) throw ticketsError;

        setTickets(ticketsData || []);

        // Example: Calculate active team members based on assignees in visible projects/tickets
        const projectIds = (projectsData || []).map(p => p.id);
        const relevantTickets = (ticketsData || []).filter(t => projectIds.includes(t.project_id));
        const uniqueAssignees = new Set(relevantTickets.map(t => t.assignee_id).filter(Boolean));
        setTeamMembersCount(uniqueAssignees.size);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        // Clear data on error
        setProjects([]);
        setTickets([]);
        setTeamMembersCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fetch once on mount

  // Calculate dashboard statistics (only use fetched tickets)
  const activeProjects = projects.length;
  const urgentTasks = tickets.filter(ticket =>
    ticket.priority === 'high' && ticket.status !== 'done'
  ).length;
  const completedTasks = tickets.filter(ticket => ticket.status === 'done').length;
  const totalTasks = tickets.length;

  // Upcoming deadlines (using fetched projects)
  const upcomingDeadlines = projects.filter(project => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    const now = new Date();
    // Consider only future deadlines within 7 days
    const diffTime = deadline.getTime() - now.getTime();
    if (diffTime <= 0) return false; // Deadline passed
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-3">
          <AlertCircleError size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Tableau de bord</h1>
        <p className="text-moon-gray">Vue d'ensemble de vos projets et tâches</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Active Projects */}
        <motion.div /* ... motion props */ className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center">
           <div className="w-12 h-12 rounded-full bg-nebula-purple/20 flex items-center justify-center mr-4">
             <Rocket size={24} className="text-nebula-purple" />
           </div>
           <div>
             <p className="text-moon-gray text-sm">Projets actifs</p>
             <h3 className="text-2xl font-orbitron text-star-white">{activeProjects}</h3>
           </div>
         </motion.div>
         {/* Urgent Tasks */}
         <motion.div /* ... motion props */ className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center">
           <div className="w-12 h-12 rounded-full bg-red-alert/20 flex items-center justify-center mr-4">
             <AlertTriangle size={24} className="text-red-alert" />
           </div>
           <div>
             <p className="text-moon-gray text-sm">Tâches urgentes</p>
             <h3 className="text-2xl font-orbitron text-star-white">{urgentTasks}</h3>
           </div>
         </motion.div>
         {/* Completed Tasks */}
         <motion.div /* ... motion props */ className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center">
           <div className="w-12 h-12 rounded-full bg-green-success/20 flex items-center justify-center mr-4">
             <CheckCircle size={24} className="text-green-success" />
           </div>
           <div>
             <p className="text-moon-gray text-sm">Tâches complétées</p>
             <h3 className="text-2xl font-orbitron text-star-white">{completedTasks}/{totalTasks}</h3>
           </div>
         </motion.div>
         {/* Upcoming Deadlines */}
         <motion.div /* ... motion props */ className="bg-deep-space p-6 rounded-xl border border-white/10 flex items-center">
           <div className="w-12 h-12 rounded-full bg-yellow-warning/20 flex items-center justify-center mr-4">
             <Calendar size={24} className="text-yellow-warning" />
           </div>
           <div>
             <p className="text-moon-gray text-sm">Deadlines proches</p>
             <h3 className="text-2xl font-orbitron text-star-white">{upcomingDeadlines}</h3>
           </div>
         </motion.div>
      </div>

      {/* Activity Placeholder */}
      <motion.div /* ... motion props */ className="bg-deep-space p-6 rounded-xl border border-white/10 mb-10 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-orbitron text-star-white">Activité de la semaine</h2>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
              <Users size={16} className="text-nebula-purple" />
            </div>
            {/* Use dynamic count or keep placeholder */}
            <span className="ml-2 text-moon-gray">
              {teamMembersCount !== null ? `${teamMembersCount} membre${teamMembersCount !== 1 ? 's' : ''} actif${teamMembersCount !== 1 ? 's' : ''}` : 'Chargement...'}
            </span>
          </div>
        </div>
        {/* Radar Chart Placeholder */}
        <div className="h-48 flex items-center justify-center">
          {/* ... placeholder visual ... */}
           <div className="text-center text-moon-gray">Radar d'activité (Placeholder)</div>
        </div>
      </motion.div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-orbitron text-star-white">Projets en cours</h2>
        {/* Add link/button to projects page maybe? */}
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {/* ProjectCard relies on its own data fetching via useEffect - this is okay */}
            <ProjectCard project={project} />
          </motion.div>
        ))}
        {projects.length === 0 && !loading && !error && (
           <p className="text-moon-gray col-span-full text-center py-8">Aucun projet à afficher.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;