import React from 'react';
import { Clock, UserCircle2 } from 'lucide-react';
import { TicketPriority } from '../../types';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { Database } from '../../types/supabase';

type TicketItemProps = {
  ticket: Database['public']['Tables']['tickets']['Row'];
  onClick: (ticket: Database['public']['Tables']['tickets']['Row']) => void;
  userMap?: Record<string, Database['public']['Tables']['users']['Row']>;
  currentUserId?: string;
};

const TicketItem: React.FC<TicketItemProps> = ({ 
  ticket, 
  onClick, 
  userMap = {}, 
  currentUserId 
}) => {
  const assignee = ticket.assignee_id ? userMap[ticket.assignee_id] : null;
  const isUrgent = ticket.priority === 'high';
  const isAssignedToMe = ticket.assignee_id === currentUserId;
  const hasDeadlineSoon = ticket.deadline && new Date(ticket.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
  
  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return '';
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
        <Badge priority={ticket.priority as TicketPriority} />
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