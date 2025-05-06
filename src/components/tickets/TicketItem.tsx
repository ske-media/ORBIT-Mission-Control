// src/components/tickets/TicketItem.tsx
import React from 'react';
import { Clock, UserCircle2, AlertTriangle as AlertTriangleIcon } from 'lucide-react'; // Renommé pour clarté
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
  const isHighPriority = ticket.priority === TicketPriority.HIGH; // Renommé pour clarté
  const isAssignedToMe = !!currentUserId && ticket.assignee_id === currentUserId; // Assure que currentUserId existe

  // Calcul de "deadline bientôt" ou "dépassée"
  let deadlineStatus: 'normal' | 'soon' | 'passed' = 'normal';
  let deadlineTextClass = 'text-moon-gray';
  if (ticket.deadline) {
    const deadlineDate = new Date(ticket.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) { // Deadline passée
      deadlineStatus = 'passed';
      deadlineTextClass = 'text-red-alert';
    } else if (diffDays <= 3) { // Deadline dans 3 jours ou moins
      deadlineStatus = 'soon';
      deadlineTextClass = 'text-yellow-warning';
    }
  }

  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
    } catch (e) {
        return 'Date invalide';
    }
  };

  return (
    <div
      className={`
        p-3.5 bg-deep-space rounded-lg border border-white/10 cursor-pointer transition-all
        hover:border-nebula-purple/60 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-purple focus-visible:ring-offset-2 focus-visible:ring-offset-space-black
        ${isHighPriority && ticket.status !== 'done' ? 'border-l-2 border-l-red-alert/70 animate-pulse-slow' : ''}
        ${isAssignedToMe ? 'ring-1 ring-galaxy-blue/50' : ''}
      `}
      onClick={() => onClick(ticket)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(ticket); }} // Accessibilité clavier
      tabIndex={0} // Rendre focusable
      role="button"
      aria-labelledby={`ticket-title-${ticket.id}`}
    >
      {/* Header: Titre et Badge de Priorité */}
      <div className="flex items-start justify-between mb-2">
        <h3 id={`ticket-title-${ticket.id}`} className="font-medium text-star-white text-sm pr-2 break-words">
          {ticket.title}
        </h3>
        <Badge priority={ticket.priority as TicketPriority} />
      </div>

      {/* Description (si présente) */}
      {ticket.description && (
        <p className="text-xs text-moon-gray mb-3 line-clamp-2">
          {ticket.description}
        </p>
      )}

      {/* Footer: Assigné et Deadline */}
      <div className="flex items-center justify-between text-xs">
        {/* Assigné */}
        <div className="flex items-center gap-1.5 min-w-0"> {/* min-w-0 pour que le truncate fonctionne */}
          {assignee ? (
            <Avatar src={assignee.avatar} alt={assignee.name} size="sm" className="w-5 h-5 border-moon-gray/50" />
          ) : (
            <UserCircle2 size={18} className="text-moon-gray/70 flex-shrink-0" />
          )}
          <span className="text-moon-gray truncate" title={assignee ? assignee.name : 'Non assigné'}>
            {assignee ? assignee.name : 'Non assigné'}
          </span>
        </div>

        {/* Deadline (si présente) */}
        {ticket.deadline && (
          <div className={`flex items-center gap-1 flex-shrink-0 ${deadlineTextClass}`}>
            {deadlineStatus === 'passed' && <AlertTriangleIcon size={12} className="flex-shrink-0" />}
            {deadlineStatus === 'soon' && <Clock size={12} className="flex-shrink-0" />}
            <span className="font-medium">{formatDeadline(ticket.deadline)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketItem;