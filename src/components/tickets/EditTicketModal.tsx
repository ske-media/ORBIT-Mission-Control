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
} from 'lucide-react';
import Button from '../ui/Button';
import { TicketStatus, TicketPriority, TicketStatusLabels } from '../../types';
import { Database } from '../../types/supabase';
import { updateTicket, getProjectMembers, createNotification } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import Avatar from '../ui/Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketType;
  onTicketUpdated: (updatedTicket: TicketType) => void;
  userMap?: Record<string, UserType>;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  onClose: onCloseProp,
  ticket,
  onTicketUpdated: onTicketUpdatedProp,
  userMap = {},
}) => {
  const { user: authUser } = useAuth();

  // --- États du Formulaire ---
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || '');
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority as TicketPriority);
  const [status, setStatus] = useState<TicketStatus>(ticket.status as TicketStatus);
  const [assigneeId, setAssigneeId] = useState<string | null>(ticket.assignee_id);
  const [deadline, setDeadline] = useState<Date | null>(ticket.deadline ? new Date(ticket.deadline) : null);

  // --- États Internes pour la Logique de la Modal ---
  const [projectMembers, setProjectMembers] = useState<UserType[]>([]);
  const [project, setProject] = useState<UserType | null>(null);

  // --- États UI ---
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Effet pour charger les membres du projet
  useEffect(() => {
    if (!isOpen || !ticket.project_id) return;

    const loadMembers = async () => {
      if (!ticket) return;
      setIsLoadingMembers(true);
      setFormError(null);
      try {
        const members = await getProjectMembers(ticket.project_id);
        setProjectMembers(members.map((pm: { user: UserType }) => pm.user).filter(Boolean));
        setProject(members.find(pm => pm.user.id === ticket.assignee_id)?.user || null);
      } catch (err) {
        console.error("Error fetching project members for modal:", err);
        setFormError("Impossible de charger les membres pour l'assignation.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [isOpen, ticket.project_id]);

  useEffect(() => {
    if (isOpen) {
      setTitle(ticket.title);
      setDescription(ticket.description || '');
      setPriority(ticket.priority as TicketPriority);
      setStatus(ticket.status as TicketStatus);
      setAssigneeId(ticket.assignee_id);
      setDeadline(ticket.deadline ? new Date(ticket.deadline) : null);
      setFormError(null);
    }
  }, [isOpen, ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Le titre du ticket est requis.");
      return;
    }
    if (!description.trim()) {
      setFormError("La description du ticket est requise.");
      return;
    }

    setIsSubmitting(true);
    const actualAssigneeId = assigneeId === 'null' || assigneeId === '' ? null : assigneeId;

    const ticketUpdates = {
      title: title.trim(),
      description: description.trim(),
      priority: priority.toLowerCase() as TicketPriority,
      status: status.toLowerCase() as TicketStatus,
      assignee_id: actualAssigneeId,
      deadline: deadline?.toISOString() || null
    };

    try {
      const updatedTicket = await updateTicket(ticket.id, ticketUpdates);
      if (!updatedTicket) throw new Error("La mise à jour du ticket a échoué.");

      // Notification si l'assigné a changé
      if (ticket.assignee_id !== updatedTicket.assignee_id &&
          updatedTicket.assignee_id && updatedTicket.assignee_id !== authUser?.id) {
        const assignerName = authUser?.user_metadata?.name || "Quelqu'un";
        const projectNameForNotif = project?.name || "un projet";
        try {
          await createNotification({
            user_id: updatedTicket.assignee_id,
            content: `${assignerName} vous a assigné la tâche "${updatedTicket.title}" dans le projet "${projectNameForNotif}".`,
            type: 'ticket_assigned',
            related_entity: 'ticket',
            related_id: updatedTicket.id,
            is_read: false
          });
        } catch (notifError) {
          console.error("Erreur création notification (assignation ticket):", notifError);
        }
      }

      onTicketUpdatedProp(updatedTicket);
      onCloseProp();
    } catch (err) {
      console.error("Error updating ticket:", err);
      setFormError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Basse' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' }
  ];

  const statusOptions = Object.entries(TicketStatusLabels).map(([value, label]) => ({
    value,
    label
  }));

  const assigneeOptions = Object.values(userMap).map(user => ({
    value: user.id,
    label: (
      <div className="flex items-center gap-2">
        <Avatar src={user.avatar} alt={user.name} size="sm" className="w-6 h-6" />
        <span>{user.name}</span>
      </div>
    )
  }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: "circOut" }}
        >
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <div>
              <h2 className="text-xl font-orbitron text-star-white">Modifier le Ticket</h2>
              <p className="text-xs text-moon-gray font-medium">ID : {ticket.id.slice(-6)}</p>
            </div>
            <button onClick={onCloseProp} className="text-moon-gray hover:text-star-white transition-colors disabled:opacity-50 p-1 rounded-full hover:bg-white/10" disabled={isSubmitting || isLoadingMembers}>
              <X size={22} />
            </button>
          </div>

          {formError && (
            <div className="p-3 mx-5 mt-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm flex-shrink-0">
              <AlertCircle size={18} /> <span className="flex-1">{formError}</span>
              <button onClick={() => setFormError(null)} className="text-red-alert/70 hover:text-red-alert p-1 rounded-full hover:bg-red-alert/10"><X size={16}/></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-star-white">Titre</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Titre du ticket"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-star-white">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Description détaillée du ticket"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-star-white">Priorité</label>
                <Select value={priority} onValueChange={(value: string) => setPriority(value as TicketPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-star-white">Statut</label>
                <Select value={status} onValueChange={(value: string) => setStatus(value as TicketStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-star-white">Assigné à</label>
              <Select value={assigneeId || ''} onValueChange={(value: string) => setAssigneeId(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non assigné</SelectItem>
                  {assigneeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-star-white">Date limite</label>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
                placeholder="Sélectionner une date"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCloseProp}
                disabled={isSubmitting || isLoadingMembers}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingMembers}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditTicketModal; 