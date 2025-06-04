// src/components/tickets/TicketModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  Type,
  Layers,
  Loader2,
  AlertTriangle,
  Edit3,
  CheckSquare,
  Clock,
  Search,
  UserPlus,
} from 'lucide-react';
import { TicketPriority, TicketStatus, TicketStatusLabels } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Database } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext'; // Pour l'ID de l'utilisateur actuel
import EditTicketModal from './EditTicketModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { addTicketAssignee, removeTicketAssignee, getTicketAssignees } from '../../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Ticket as SupabaseTicket } from "../../lib/supabase";

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectType = Database['public']['Tables']['projects']['Row'];

interface TicketModalProps {
  ticket: TicketType | null;
  onClose: () => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onAssignToMe: (ticketId: string, userId?: string | null) => Promise<TicketType | null | void>;
  onTicketUpdated: (updatedTicket: TicketType) => void;
  userMap?: Record<string, UserType>;
  projectData?: ProjectType | null;
}

const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  onClose,
  onStatusChange,
  onAssignToMe,
  onTicketUpdated,
  userMap = {},
  projectData
}) => {
  const { user: authUser } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignees, setAssignees] = useState<UserType[]>([]);

  useEffect(() => {
    if (ticket) {
      loadAssignees();
    }
  }, [ticket]);

  const loadAssignees = async () => {
    if (!ticket) return;
    try {
      const assigneesList = await getTicketAssignees(ticket.id);
      setAssignees(assigneesList);
    } catch (error) {
      console.error("Error loading assignees:", error);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    try {
      await addTicketAssignee(ticket.id, userId);
      await loadAssignees();
      setSearchTerm('');
    } catch (error) {
      console.error("Error assigning user:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    try {
      await removeTicketAssignee(ticket.id, userId);
      await loadAssignees();
    } catch (error) {
      console.error("Error unassigning user:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ticket) return null;

  const assignee = ticket.assignee_id ? userMap[ticket.assignee_id] : null;
  const project = projectData;
  const isCurrentUserAssignee = authUser?.id === ticket.assignee_id;

  const handleClose = () => {
    if (isUpdating) return;
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
    } catch (error) {
      console.error("Error performing ticket action:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusButtonClick = (newStatus: TicketStatus) => {
    if (ticket.status.toLowerCase() === newStatus.toLowerCase()) return;
    handleAction(() => onStatusChange(ticket.id, newStatus));
  };

  const handleAssignToUser = async (userId: string | null) => {
    if (!ticket) return;
    handleAction(async () => {
      const updatedTicket = await onAssignToMe(ticket.id, userId || undefined);
      if (updatedTicket) {
        onTicketUpdated(updatedTicket);
      }
    });
  };

  const filteredUsers = Object.values(userMap).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAsDoneClick = () => {
    if (ticket.status.toLowerCase() === TicketStatus.DONE.toLowerCase()) return;
    handleAction(() => onStatusChange(ticket.id, TicketStatus.DONE));
  };

  return (
    <>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  disabled={isUpdating}
                  className="text-moon-gray hover:text-star-white"
                >
                  <Edit3 size={16} className="mr-2" />
                  Modifier
                </Button>
                <button onClick={handleClose} className="text-moon-gray hover:text-star-white transition-colors p-1 rounded-full hover:bg-white/10" disabled={isUpdating}>
                  <X size={22} />
                </button>
              </div>
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
                  <div className="flex items-center gap-2 mb-2 text-moon-gray text-sm"><User size={15} />Assignés</div>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-deep-space border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
                        disabled={isUpdating}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
                    </div>

                    {searchTerm && filteredUsers.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto bg-deep-space border border-white/10 rounded-lg shadow-lg mt-1">
                        {filteredUsers
                          .filter(user => !assignees.find(a => a.id === user.id))
                          .map(user => (
                            <li
                              key={user.id}
                              onClick={() => handleAssignUser(user.id)}
                              className="p-2 flex items-center gap-2 hover:bg-nebula-purple/10 cursor-pointer text-sm"
                            >
                              <Avatar src={user.avatar} alt={user.name} size="sm" />
                              <span className="text-star-white">{user.name}</span>
                              <span className="text-moon-gray ml-auto truncate">{user.email}</span>
                            </li>
                          ))}
                      </ul>
                    )}

                    <div className="space-y-2">
                      {assignees.map(assignee => (
                        <div key={assignee.id} className="flex items-center gap-2 p-2 bg-deep-space rounded-lg border border-white/5">
                          <Avatar 
                            src={assignee.avatar || ''} 
                            alt={assignee.name || ''} 
                            size="sm" 
                          />
                          <span className="text-star-white">{assignee.name}</span>
                          <button
                            onClick={() => handleUnassignUser(assignee.id)}
                            className="ml-auto text-moon-gray hover:text-red-alert p-1 rounded-full hover:bg-red-alert/10"
                            disabled={isUpdating}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-sm text-moon-gray mb-3">Changer le Statut :</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={ticket.status.toLowerCase() === option.value.toLowerCase() ? 'default' : 'outline'}
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
                <div className="flex items-center gap-2 text-moon-gray"><CalendarIcon size={15} />Historique</div>
                <div className="flex justify-between"><span className="text-moon-gray">Créé le :</span><span className="text-star-white/80">{formatDate(ticket.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-moon-gray">Modifié le :</span><span className="text-star-white/80">{formatDate(ticket.updated_at)}</span></div>
              </div>

              {/* Alerte Priorité Haute */}
              {(ticket.priority === 'high' && ticket.status.toLowerCase() !== 'done') && (
                <div className="bg-red-alert/10 border border-red-alert/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-alert flex-shrink-0 mt-0.5" />
                  <div><h4 className="text-red-alert font-semibold mb-1">Priorité Haute</h4><p className="text-sm text-red-alert/80">Ce ticket nécessite une attention rapide.</p></div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-white/10 p-4 flex justify-end gap-3 flex-shrink-0">
              <Button variant="ghost" onClick={handleClose} disabled={isUpdating}>Fermer</Button>
              {ticket.status.toLowerCase() !== 'done' && (
                <Button
                  variant="default"
                  onClick={handleMarkAsDoneClick}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin"/> : <CheckSquare size={16}/>}
                  Marquer comme terminé
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {showEditModal && ticket && (
        <EditTicketModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          ticket={ticket}
          onTicketUpdated={(updatedTicket) => {
            onTicketUpdated(updatedTicket);
            setShowEditModal(false);
          }}
          userMap={userMap}
        />
      )}
    </>
  );
};

export default TicketModal;