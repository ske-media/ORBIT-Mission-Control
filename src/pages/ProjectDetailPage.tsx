import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, ListFilter, Users, Layers, AlertTriangle } from 'lucide-react';
import { Ticket, TicketStatus, TicketStatusLabels } from '../types';
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { 
  getProjectById, 
  getTicketsByProject, 
  getUserById, 
  getCurrentUserProfile,
  updateTicket 
} from '../lib/supabase';
import { Database } from '../types/supabase';

type ProjectType = Database['public']['Tables']['projects']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type TicketType = Database['public']['Tables']['tickets']['Row'];

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [team, setTeam] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, UserType>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch project details
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Fetch tickets for this project
        const ticketsData = await getTicketsByProject(projectId);
        setTickets(ticketsData);
        
        // Fetch current user
        const user = await getCurrentUserProfile();
        setCurrentUser(user);
        
        // Get unique assignee IDs from tickets
        const assigneeIds = new Set<string>();
        ticketsData.forEach(ticket => {
          if (ticket.assignee_id) assigneeIds.add(ticket.assignee_id);
        });
        
        // Fetch team members info
        const usersData: UserType[] = [];
        const userMapData: Record<string, UserType> = {};
        
        for (const id of assigneeIds) {
          const userData = await getUserById(id);
          if (userData) {
            usersData.push(userData);
            userMapData[id] = userData;
          }
        }
        
        setTeam(usersData);
        setUserMap(userMapData);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);
  
  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return 'Pas de deadline';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };
  
  const filteredTickets = tickets.filter(ticket => {
    if (filterMine && ticket.assignee_id !== currentUser?.id) return false;
    if (filterUrgent && ticket.priority !== 'high') return false;
    return true;
  });
  
  const ticketsByStatus = Object.values(TicketStatus).reduce((acc, status) => {
    acc[status] = filteredTickets.filter(ticket => ticket.status === status.toLowerCase());
    return acc;
  }, {} as Record<TicketStatus, TicketType[]>);
  
  const handleTicketClick = (ticket: TicketType) => {
    setSelectedTicket(ticket);
  };
  
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      // Update in Supabase
      const updatedTicket = await updateTicket(ticketId, {
        status: newStatus.toLowerCase()
      });
      
      // Update local state
      if (updatedTicket) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? updatedTicket
            : ticket
        ));
        
        // Update selected ticket if it's open
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };
  
  const handleAssignToMe = async (ticketId: string) => {
    if (!currentUser) return;
    
    try {
      // Update in Supabase
      const updatedTicket = await updateTicket(ticketId, {
        assignee_id: currentUser.id
      });
      
      // Update local state
      if (updatedTicket) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? updatedTicket
            : ticket
        ));
        
        // Update selected ticket if it's open
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };
  
  const handleAddTicket = (status: TicketStatus) => {
    // This would typically open a modal to create a new ticket
    console.log(`Add ticket with status: ${status}`);
  };
  
  // Calculate project stats
  const completion = React.useMemo(() => {
    if (!tickets.length) return 0;
    const completedTickets = tickets.filter(t => t.status === 'done').length;
    return Math.round((completedTickets / tickets.length) * 100);
  }, [tickets]);
  
  const urgentCount = React.useMemo(() => {
    return filteredTickets.filter(t => t.priority === 'high' && t.status !== 'done').length;
  }, [filteredTickets]);
  
  const totalTasks = filteredTickets.length;
  const completedTasks = filteredTickets.filter(t => t.status === 'done').length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center text-moon-gray">Projet non trouvé</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">{project.name}</h1>
        <p className="text-moon-gray">{project.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-deep-space rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-moon-gray" />
            <h3 className="text-lg font-medium text-star-white">Deadline</h3>
          </div>
          <p className="text-xl font-orbitron text-star-white">{formatDeadline(project.deadline)}</p>
        </div>
        
        <div className="bg-deep-space rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-moon-gray" />
            <h3 className="text-lg font-medium text-star-white">Progression</h3>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-moon-gray">{completedTasks}/{totalTasks} tâches</span>
            <span className="text-star-white">{completion}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-nebula-purple"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-deep-space rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-moon-gray" />
            <h3 className="text-lg font-medium text-star-white">Équipe</h3>
          </div>
          <div className="flex -space-x-2 overflow-hidden">
            {team.map(user => (
              <Avatar 
                key={user.id} 
                src={user.avatar} 
                alt={user.name} 
                size="md" 
                className="border border-deep-space"
              />
            ))}
            <button className="w-10 h-10 rounded-full bg-white/10 text-star-white flex items-center justify-center text-xs">
              +
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-orbitron text-star-white">Tableau Kanban</h2>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1 bg-red-alert/20 text-red-alert px-3 py-1 rounded-full">
              <AlertTriangle size={14} />
              <span className="text-xs">{urgentCount} urgent{urgentCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            iconLeft={<ListFilter size={16} />}
            onClick={() => setFilterMine(!filterMine)}
            className={filterMine ? 'bg-nebula-purple/20 text-nebula-purple' : ''}
          >
            Mes tâches
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            iconLeft={<AlertTriangle size={16} />}
            onClick={() => setFilterUrgent(!filterUrgent)}
            className={filterUrgent ? 'bg-red-alert/20 text-red-alert' : ''}
          >
            Urgent
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {Object.values(TicketStatus).map(status => (
            <div key={status} className="h-[calc(100vh-360px)]">
              <KanbanColumn 
                status={status}
                title={TicketStatusLabels[status]}
                tickets={ticketsByStatus[status] || []}
                onTicketClick={handleTicketClick}
                onAddTicket={handleAddTicket}
              />
            </div>
          ))}
        </div>
      </div>
      
      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)} 
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          userMap={userMap}
          projectData={project}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;