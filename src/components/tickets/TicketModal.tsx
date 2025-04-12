import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, User, Clock } from 'lucide-react';
import { TicketPriority, TicketStatus } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Database } from '../../types/supabase';

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectType = Database['public']['Tables']['projects']['Row'];

type TicketModalProps = {
  ticket: TicketType | null;
  onClose: () => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onAssignToMe: (ticketId: string) => void;
  userMap?: Record<string, UserType>;
  projectData?: ProjectType | null;
};

const TicketModal: React.FC<TicketModalProps> = ({ 
  ticket, 
  onClose, 
  onStatusChange, 
  onAssignToMe,
  userMap = {},
  projectData
}) => {
  const [isClosing, setIsClosing] = useState(false);
  
  if (!ticket) return null;
  
  const assignee = ticket.assignee_id ? userMap[ticket.assignee_id] : null;
  const project = projectData;
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pas de deadline';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };
  
  const isDeadlineSoon = () => {
    if (!ticket.deadline) return false;
    const deadline = new Date(ticket.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };
  
  const deadlinePassed = () => {
    if (!ticket.deadline) return false;
    const deadline = new Date(ticket.deadline);
    const now = new Date();
    return deadline < now;
  };
  
  const statusOptions = Object.values(TicketStatus).map(status => ({
    value: status,
    label: status === TicketStatus.BACKLOG ? 'Backlog' : 
           status === TicketStatus.TODO ? 'À faire' : 
           status === TicketStatus.IN_PROGRESS ? 'En cours' : 
           status === TicketStatus.REVIEW ? 'En review' : 'Fait'
  }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div 
          className="relative bg-deep-space rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: isClosing ? 0.9 : 1, opacity: isClosing ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-orbitron text-star-white">Ticket #{ticket.id.slice(-8)}</h2>
              <Badge priority={ticket.priority as TicketPriority} />
            </div>
            <button 
              onClick={handleClose}
              className="text-moon-gray hover:text-star-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
            <h3 className="text-2xl font-orbitron text-star-white mb-2">{ticket.title}</h3>
            
            {project && (
              <div className="mb-6">
                <span className="text-sm text-moon-gray">Projet: </span>
                <span className="text-sm text-nebula-purple">{project.name}</span>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-star-white">{ticket.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-space-black/50 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-moon-gray" />
                  <h4 className="text-sm text-moon-gray">Deadline</h4>
                </div>
                <p className={`
                  font-medium 
                  ${deadlinePassed() ? 'text-red-alert' : isDeadlineSoon() ? 'text-yellow-warning' : 'text-star-white'}
                `}>
                  {formatDate(ticket.deadline)}
                </p>
              </div>
              
              <div className="bg-space-black/50 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-moon-gray" />
                  <h4 className="text-sm text-moon-gray">Assigné à</h4>
                </div>
                {assignee ? (
                  <div className="flex items-center gap-3">
                    <Avatar src={assignee.avatar} alt={assignee.name} size="sm" />
                    <span className="text-star-white">{assignee.name}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-moon-gray">Non assigné</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAssignToMe(ticket.id)}
                    >
                      M'assigner
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-8">
              <h4 className="text-sm text-moon-gray mb-3">Statut</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      ticket.status === option.value.toLowerCase()
                        ? 'bg-nebula-purple text-star-white'
                        : 'bg-white/5 text-moon-gray hover:bg-white/10'
                    }`}
                    onClick={() => onStatusChange(ticket.id, option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-space-black/50 p-4 rounded-lg border border-white/5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-moon-gray" />
                <h4 className="text-sm text-moon-gray">Historique</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-moon-gray">Créé le</span>
                  <span className="text-star-white">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-moon-gray">Dernière modification</span>
                  <span className="text-star-white">{formatDate(ticket.updated_at)}</span>
                </div>
              </div>
            </div>
            
            {(ticket.priority === 'high' && ticket.status !== 'done') && (
              <div className="bg-red-alert/10 border border-red-alert/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-alert flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-alert font-medium mb-1">Priorité haute</h4>
                  <p className="text-sm text-red-alert/80">Ce ticket nécessite votre attention rapidement.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/10 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Fermer
            </Button>
            {!assignee && (
              <Button variant="primary" onClick={() => onAssignToMe(ticket.id)}>
                M'assigner
              </Button>
            )}
            {ticket.status !== 'done' && (
              <Button 
                variant="primary"
                onClick={() => onStatusChange(ticket.id, TicketStatus.DONE)}
              >
                Marquer comme terminé
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TicketModal;