// src/components/tickets/TicketModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertTriangle as AlertTriangleIcon, User, Clock, CheckSquare, Loader2 } from 'lucide-react'; // Ajout CheckSquare, Loader2
import { TicketPriority, TicketStatus, TicketStatusLabels } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Database } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext'; // Pour l'ID de l'utilisateur actuel

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectType = Database['public']['Tables']['projects']['Row'];

interface TicketModalProps {
  ticket: TicketType | null;
  onClose: () => void;
  // Ces fonctions sont maintenant async car ProjectDetailPage.handleTicketUpdate est async
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onAssignToMe: (ticketId: string) => Promise<TicketType | null | void>; // Retourne le ticket mis à jour ou rien
  userMap?: Record<string, UserType>;
  projectData?: ProjectType | null;
}

const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  onClose,
  onStatusChange,
  onAssignToMe,
  userMap = {},
  projectData
}) => {
  const { user: authUser } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // État pour les actions de mise à jour

  if (!ticket) return null;

  const assignee = ticket.assignee_id ? userMap[ticket.assignee_id] : null;
  const project = projectData; // Nom du projet
  const isCurrentUserAssignee = authUser?.id === ticket.assignee_id;

  const handleClose = () => {
    if (isUpdating) return; // Empêche la fermeture pendant une update
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pas de deadline';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
    } catch (e) { return "Date invalide"; }
  };

  const isDeadlineSoon = () => { /* ... (logique existante) ... */ return false; };
  const deadlinePassed = () => { /* ... (logique existante) ... */ return false; };

  const statusOptions = Object.values(TicketStatus).map(s => ({ value: s, label: TicketStatusLabels[s] }));

  const handleAction = async (action: () => Promise<any>) => {
    setIsUpdating(true);
    try {
      await action();
      // Pas besoin de fermer la modal ici, le parent (ProjectDetailPage) mettra à jour l'état du ticket
      // ce qui re-rendra cette modal avec les nouvelles données si elle est toujours ouverte.
    } catch (error) {
      console.error("Error performing ticket action:", error);
      // Gérer l'affichage de l'erreur dans ProjectDetailPage
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusButtonClick = (newStatus: TicketStatus) => {
    if (ticket.status.toLowerCase() === newStatus.toLowerCase()) return;
    handleAction(() => onStatusChange(ticket.id, newStatus));
  };

  const handleAssignButtonClick = () => {
    handleAction(() => onAssignToMe(ticket.id));
  };

  const handleMarkAsDoneClick = () => {
    if (ticket.status.toLowerCase() === TicketStatus.DONE.toLowerCase()) return;
    handleAction(() => onStatusChange(ticket.id, TicketStatus.DONE));
  };


  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: isClosing ? 0.9 : 1, opacity: isClosing ? 0 : 1 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: "circOut" }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-orbitron text-star-white truncate" title={`Ticket #${ticket.id.slice(-6)}`}>Ticket #{ticket.id.slice(-6)}</h2>
              <Badge priority={ticket.priority as TicketPriority} />
            </div>
            <button onClick={handleClose} className="text-moon-gray hover:text-star-white transition-colors p-1 rounded-full hover:bg-white/10" disabled={isUpdating}>
              <X size={22} />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            <h3 className="text-2xl font-orbitron text-star-white mb-1 break-words">{ticket.title}</h3>
            {project && (
              <div className="mb-4">
                <span className="text-sm text-moon-gray">Projet : </span>
                <span className="text-sm text-nebula-purple font-medium">{project.name}</span>
              </div>
            )}
            {ticket.description && <p className="text-star-white/90 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
              {/* Deadline Info */}
              <div className="bg-space-black/40 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-moon-gray text-sm"><Clock size={15} />Deadline</div>
                <p className={`font-medium ${deadlinePassed() ? 'text-red-alert' : isDeadlineSoon() ? 'text-yellow-warning' : 'text-star-white'}`}>
                  {formatDate(ticket.deadline)}
                </p>
              </div>
              {/* Assignee Info */}
              <div className="bg-space-black/40 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-moon-gray text-sm"><User size={15} />Assigné à</div>
                {assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={assignee.avatar} alt={assignee.name} size="sm" className="w-7 h-7" />
                    <span className="text-star-white font-medium">{assignee.name}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-moon-gray italic">Non assigné</span>
                    {/* Bouton s'assigner (si pas déjà assigné à soi-même) */}
                    {authUser && ticket.assignee_id !== authUser.id && (
                        <Button variant="outline" size="xs" onClick={handleAssignButtonClick} disabled={isUpdating} className="text-xs">
                            {isUpdating ? <Loader2 size={14} className="animate-spin"/> : "M'assigner"}
                        </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-sm text-moon-gray mb-3">Changer le Statut :</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={ticket.status.toLowerCase() === option.value.toLowerCase() ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusButtonClick(option.value)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 text-xs rounded-full ${ticket.status.toLowerCase() === option.value.toLowerCase() ? 'bg-nebula-purple text-star-white shadow-neon' : 'bg-white/5 text-moon-gray hover:bg-white/10 hover:text-star-white'}`}
                  >
                    {isUpdating && ticket.status.toLowerCase() === option.value.toLowerCase() ? <Loader2 size={14} className="animate-spin"/> : option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Historique Simple */}
            <div className="bg-space-black/40 p-4 rounded-lg border border-white/5 text-sm space-y-2">
              <div className="flex items-center gap-2 text-moon-gray"><Calendar size={15} />Historique</div>
              <div className="flex justify-between"><span className="text-moon-gray">Créé le :</span><span className="text-star-white/80">{formatDate(ticket.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-moon-gray">Modifié le :</span><span className="text-star-white/80">{formatDate(ticket.updated_at)}</span></div>
            </div>

            {/* Alerte Priorité Haute */}
            {(ticket.priority === 'high' && ticket.status.toLowerCase() !== 'done') && (
              <div className="bg-red-alert/10 border border-red-alert/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangleIcon size={20} className="text-red-alert flex-shrink-0 mt-0.5" />
                <div><h4 className="text-red-alert font-semibold mb-1">Priorité Haute</h4><p className="text-sm text-red-alert/80">Ce ticket nécessite une attention rapide.</p></div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-4 flex justify-end gap-3 flex-shrink-0">
            <Button variant="ghost" onClick={handleClose} disabled={isUpdating}>Fermer</Button>
            {/* Bouton M'assigner (si non assigné et pas déjà moi) OU Marquer comme terminé */}
            {ticket.status.toLowerCase() !== 'done' && (
              <Button
                variant="primary"
                onClick={handleMarkAsDoneClick}
                disabled={isUpdating}
                iconLeft={isUpdating ? <Loader2 size={16} className="animate-spin"/> : <CheckSquare size={16}/>}
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