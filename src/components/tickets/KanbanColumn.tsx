import React from 'react';
import { Plus } from 'lucide-react';
import { Ticket, TicketStatus } from '../../types';
import TicketItem from './TicketItem';
import Button from '../ui/Button';

type KanbanColumnProps = {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onAddTicket: (status: TicketStatus) => void;
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tickets,
  onTicketClick,
  onAddTicket
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
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;