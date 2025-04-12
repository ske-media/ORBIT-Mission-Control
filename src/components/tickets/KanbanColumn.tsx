import React from 'react';
import { Plus } from 'lucide-react';
import { TicketStatus } from '../../types';
import TicketItem from './TicketItem';
import Button from '../ui/Button';
import { Database } from '../../types/supabase';

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];

type KanbanColumnProps = {
  status: TicketStatus;
  title: string;
  tickets: TicketType[];
  onTicketClick: (ticket: TicketType) => void;
  onAddTicket: (status: TicketStatus) => void;
  userMap?: Record<string, UserType>;
  currentUserId?: string;
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tickets,
  onTicketClick,
  onAddTicket,
  userMap = {},
  currentUserId
}) => {
  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-star-white">{title}</h3>
          <span className="bg-white/10 text-moon-gray text-xs px-2 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          iconLeft={<Plus size={16} />}
          onClick={() => onAddTicket(status)}
        >
          Ajouter
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {tickets.map(ticket => (
          <TicketItem 
            key={ticket.id} 
            ticket={ticket} 
            onClick={onTicketClick}
            userMap={userMap}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;