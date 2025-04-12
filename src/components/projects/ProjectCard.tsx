import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];

type ProjectCardProps = {
  project: Project;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [completion, setCompletion] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!project.id) {
          console.error('Project ID is undefined or null');
          setLoading(false);
          return;
        }
        
        // Validate UUID format to prevent errors
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id)) {
          console.error(`Invalid UUID format for project: ${project.id}`);
          setLoading(false);
          return;
        }
        
        // Fetch tickets for this project
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('project_id', project.id);
          
        if (error) throw error;
        
        // Calculate statistics
        const total = tickets?.length || 0;
        const completed = tickets?.filter(ticket => ticket.status === 'done').length || 0;
        const urgent = tickets?.filter(ticket => 
          ticket.priority === 'high' && ticket.status !== 'done'
        ).length || 0;
        
        setTotalTickets(total);
        setUrgentCount(urgent);
        setCompletion(total > 0 ? Math.round((completed / total) * 100) : 0);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [project.id]);
  
  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return 'Pas de deadline';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };
  
  const isDeadlineSoon = () => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };
  
  const deadlinePassed = () => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    const now = new Date();
    return deadline < now;
  };

  return (
    <Link 
      to={`/projects/${project.id}`}
      className="block bg-deep-space rounded-xl overflow-hidden border border-white/10 hover:border-nebula-purple/50 transition-all hover:shadow-lg"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-orbitron text-star-white">{project.name}</h3>
            <p className="text-sm text-moon-gray">{project.client_name || 'Projet interne'}</p>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1 text-red-alert">
              <AlertCircle size={16} />
              <span className="text-sm">{urgentCount}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-moon-gray mb-6 line-clamp-2">{project.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-moon-gray">Progression</span>
            <span className="text-xs text-star-white">{completion}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-nebula-purple"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-moon-gray">{totalTickets} tâche{totalTickets !== 1 ? 's' : ''}</span>
          </div>
          
          <div className={`
            flex items-center gap-1 text-xs
            ${deadlinePassed() ? 'text-red-alert' : isDeadlineSoon() ? 'text-yellow-warning' : 'text-moon-gray'}
          `}>
            <Clock size={14} />
            <span>{formatDeadline(project.deadline)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;