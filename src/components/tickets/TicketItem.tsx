import React from 'react';
import { Clock, UserCircle2 } from 'lucide-react';
import { Ticket, TicketPriority } from '../../types';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { getUserById, getCurrentUser } from '../../data/mockData';

type TicketItemProps = {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
};

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onClick }) => {
  const assignee = ticket.assigneeId ? getUserById(ticket.assigneeId) : null;
  const isUrgent = ticket.priority === TicketPriority.HIGH;
  const currentUser = getCurrentUser();
  const isAssignedToMe = ticket.assigneeId === currentUser.id;
  const hasDeadlineSoon = ticket.deadline && new Date(ticket.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
  
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
  };

  return (
    <div 
      className={`
        p-4 bg-deep-space rounded-lg border border-white/10 cursor-pointer transition-all
        hover:border-nebula-purple/50 hover:shadow-md
        ${isUrgent ? 'animate-pulse-slow' : ''}
        ${isAssignedToMe ? 'border-l-4 border-l-galaxy-blue' : ''}
      `}
      onClick={() => onClick(ticket)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-star-white">{ticket.title}</h3>
        <Badge priority={ticket.priority} />
      </div>
      
      <p className="text-sm text-moon-gray mb-4 line-clamp-2">{ticket.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {assignee ? (
            <Avatar src={assignee.avatar} alt={assignee.name} size="sm" />
          ) : (
            <UserCircle2 size={24} className="text-moon-gray" />
          )}
          <span className="text-xs text-moon-gray">
            {assignee ? assignee.name : 'Non assigné'}
          </span>
        </div>
        
        {ticket.deadline && (
          <div className={`
            flex items-center gap-1 
            ${hasDeadlineSoon ? 'text-red-alert' : 'text-moon-gray'}
          `}>
            <Clock size={14} />
            <span className="text-xs">{formatDeadline(ticket.deadline)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketItem;