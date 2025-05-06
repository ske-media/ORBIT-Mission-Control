// src/components/tickets/KanbanColumn.tsx
import React from 'react';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react'; // Ajout AlertTriangle, Loader2
import { TicketStatus } from '../../types';
import TicketItem from './TicketItem';
import Button from '../ui/Button';
import { Database } from '../../types/supabase';
import { motion } from 'framer-motion'; // Optionnel: pour l'animation des items

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
  isLoadingTickets?: boolean; // Optionnel: pour indiquer si les tickets de cette colonne chargent
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tickets,
  onTicketClick,
  onAddTicket,
  userMap = {},
  currentUserId,
  isLoadingTickets = false, // Valeur par défaut
}) => {
  // Style de la bordure et de l'arrière-plan en fonction du statut (optionnel, pour plus de visuel)
  const getColumnStyle = () => {
    switch (status) {
      case TicketStatus.BACKLOG:
        return 'border-moon-gray/20 bg-deep-space/30';
      case TicketStatus.TODO:
        return 'border-galaxy-blue/30 bg-galaxy-blue/5';
      case TicketStatus.IN_PROGRESS:
        return 'border-yellow-warning/30 bg-yellow-warning/5';
      case TicketStatus.REVIEW:
        return 'border-nebula-purple/30 bg-nebula-purple/5';
      case TicketStatus.DONE:
        return 'border-green-success/30 bg-green-success/5';
      default:
        return 'border-white/10';
    }
  };

  return (
    <div className={`flex flex-col h-full min-w-[300px] max-w-[340px] p-3 rounded-xl border ${getColumnStyle()} shadow-sm`}>
      {/* Header de la Colonne */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-orbitron text-base text-star-white">{title}</h3>
          <span className={`flex items-center justify-center text-xs px-2 py-0.5 rounded-full transition-colors ${tickets.length > 0 ? 'bg-white/20 text-star-white' : 'bg-white/10 text-moon-gray'}`}>
            {isLoadingTickets ? <Loader2 size={12} className="animate-spin" /> : tickets.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<Plus size={16} />}
          onClick={() => onAddTicket(status)}
          className="text-moon-gray hover:text-nebula-purple"
          title={`Ajouter un ticket à "${title}"`}
        >
          {/* Optionnel : Ne pas afficher "Ajouter" si trop étroit, juste l'icône */}
          {/* Ajouter */}
        </Button>
      </div>

      {/* Liste des Tickets (scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoadingTickets && tickets.length === 0 && ( // Affiche un loader si on charge et pas encore de tickets
            <div className="flex justify-center items-center h-32">
                <Loader2 size={24} className="text-moon-gray animate-spin" />
            </div>
        )}
        {!isLoadingTickets && tickets.length === 0 && (
          <div className="p-4 text-center text-sm text-moon-gray/70 rounded-md border border-dashed border-white/10">
            Aucun ticket ici.
          </div>
        )}
        {/* Animation pour chaque item (optionnel) */}
        {tickets.map((ticket, index) => (
          <motion.div
            key={ticket.id} // La clé est déjà ici, c'est parfait
            layout // Pour animer les changements de position (si drag-and-drop plus tard)
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <TicketItem
              ticket={ticket}
              onClick={onTicketClick}
              userMap={userMap}
              currentUserId={currentUserId}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;