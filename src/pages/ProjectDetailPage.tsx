import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Calendar, ListFilter, Users, Layers, AlertTriangle } from 'lucide-react';
import { 
  getProjectById, 
  getTicketsByProject, 
  getUserById, 
  getProjectCompletion,
  getCurrentUser
} from '../data/mockData';
import { Ticket, TicketStatus, TicketStatusLabels } from '../types';
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    if (!projectId) return [];
    return getTicketsByProject(projectId);
  });
  const [filterMine, setFilterMine] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  
  const project = projectId ? getProjectById(projectId) : null;
  const completion = projectId ? getProjectCompletion(projectId) : 0;
  const currentUser = getCurrentUser();
  
  if (!project) {
    return <div className="p-8 text-center text-moon-gray">Projet non trouvé</div>;
  }
  
  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return 'Pas de deadline';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };
  
  const getTeamMembers = () => {
    const memberIds = new Set(tickets
      .filter(ticket => ticket.assigneeId)
      .map(ticket => ticket.assigneeId));
    
    return Array.from(memberIds)
      .filter((id): id is string => id !== null)
      .map(id => getUserById(id))
      .filter((user): user is NonNullable<ReturnType<typeof getUserById>> => user !== undefined);
  };
  
  const filteredTickets = tickets.filter(ticket => {
    if (filterMine && ticket.assigneeId !== currentUser.id) return false;
    if (filterUrgent && ticket.priority !== 'high') return false;
    return true;
  });
  
  const ticketsByStatus = Object.values(TicketStatus).reduce((acc, status) => {
    acc[status] = filteredTickets.filter(ticket => ticket.status === status);
    return acc;
  }, {} as Record<TicketStatus, Ticket[]>);
  
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };
  
  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } 
        : ticket
    ));
    
    // Update the selected ticket if it's open
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  const handleAssignToMe = (ticketId: string) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            assigneeId: currentUser.id, 
            updatedAt: new Date().toISOString() 
          } 
        : ticket
    ));
    
    // Update the selected ticket if it's open
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        assigneeId: currentUser.id,
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const ticketId = active.id as string;
      const newStatus = over.id as TicketStatus;
      
      handleStatusChange(ticketId, newStatus);
    }
  };
  
  const handleAddTicket = (status: TicketStatus) => {
    // This would typically open a modal to create a new ticket
    console.log(`Add ticket with status: ${status}`);
  };
  
  const team = getTeamMembers();
  const urgentCount = filteredTickets.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const totalTasks = filteredTickets.length;
  const completedTasks = filteredTickets.filter(t => t.status === 'done').length;

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
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;