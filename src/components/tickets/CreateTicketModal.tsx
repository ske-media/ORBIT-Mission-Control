// src/components/tickets/CreateTicketModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Calendar as CalendarIcon, User, Tag, Type, Layers, Briefcase, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { TicketStatus, TicketPriority, TicketStatusLabels } from '../../types';
import { Database } from '../../types/supabase';
import { createTicket, getProjectMembers, createNotification } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext'; // Pour connaître l'utilisateur actuel

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectTypeForSelect = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>;
type NewTicketData = Omit<Database['public']['Tables']['tickets']['Insert'], 'id' | 'created_at' | 'updated_at'>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  availableProjects?: ProjectTypeForSelect[];
  initialStatus?: TicketStatus;
  onTicketCreated: (newTicket: TicketType) => void;
  defaultTitle?: string;
  defaultDescription?: string;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  projectId: initialProjectId,
  projectName: initialProjectName,
  availableProjects = [],
  initialStatus,
  onTicketCreated,
  defaultTitle = '',
  defaultDescription = '',
}) => {
  const { user: authUser } = useAuth(); // Utilisateur qui crée le ticket

  // États du Formulaire
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [status, setStatus] = useState<TicketStatus>(initialStatus || TicketStatus.BACKLOG);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);

  // États Internes pour la Logique de la Modal
  const [selectedProjectIdInternal, setSelectedProjectIdInternal] = useState<string | null>(initialProjectId || null);
  const [selectedProjectNameInternal, setSelectedProjectNameInternal] = useState<string | null>(initialProjectName || null);
  const [internalProjectMembers, setInternalProjectMembers] = useState<UserType[]>([]);
  const [loadingInternalMembers, setLoadingInternalMembers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser et charger les membres
  const resetAndLoadMembers = useCallback(async (pid: string | null) => {
    if (!pid) {
      setInternalProjectMembers([]);
      return;
    }
    setLoadingInternalMembers(true);
    setError(null);
    try {
      const members = await getProjectMembers(pid);
      setInternalProjectMembers(
        members.map(pm => pm.users).filter((user): user is UserType => user !== null)
      );
    } catch (err) {
      console.error("Error fetching project members in modal:", err);
      setError("Impossible de charger les membres pour l'assignation.");
      setInternalProjectMembers([]);
    } finally {
      setLoadingInternalMembers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setPriority(TicketPriority.MEDIUM);
      setStatus(initialStatus || TicketStatus.BACKLOG);
      setAssigneeId(null);
      setDeadline(null);
      setError(null);
      const currentProjectId = initialProjectId || null;
      setSelectedProjectIdInternal(currentProjectId);
      setSelectedProjectNameInternal(initialProjectName || (currentProjectId ? availableProjects.find(p=>p.id === currentProjectId)?.name : null) || null);
      setInternalProjectMembers([]);
      if (currentProjectId) {
        resetAndLoadMembers(currentProjectId);
      }
    }
  }, [isOpen, defaultTitle, defaultDescription, initialStatus, initialProjectId, initialProjectName, resetAndLoadMembers, availableProjects]);


  const handleProjectSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    if (newProjectId === "null" || !newProjectId) {
      setSelectedProjectIdInternal(null);
      setSelectedProjectNameInternal(null);
      setInternalProjectMembers([]);
    } else {
      setSelectedProjectIdInternal(newProjectId);
      const project = availableProjects.find(p => p.id === newProjectId);
      setSelectedProjectNameInternal(project?.name || null);
      resetAndLoadMembers(newProjectId); // Charge les membres pour le projet nouvellement sélectionné
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProjectIdInternal) { setError("Veuillez sélectionner un projet."); return; }
    if (!title.trim()) { setError("Le titre du ticket est requis."); return; }
    if (!description.trim()) { setError("La description du ticket est requise."); return; }

    setCreating(true);
    const actualAssigneeId = assigneeId === 'null' || assigneeId === '' ? null : assigneeId;

    const ticketData: NewTicketData = {
      project_id: selectedProjectIdInternal,
      title: title.trim(),
      description: description.trim(),
      priority: priority.toLowerCase() as TicketPriority,
      status: status.toLowerCase() as TicketStatus,
      assignee_id: actualAssigneeId,
      deadline: deadline || null,
    };

    try {
      const newTicket = await createTicket(ticketData);
      onTicketCreated(newTicket);

      // --- NOTIFICATION : TÂCHE ASSIGNÉE (si applicable) ---
      if (newTicket.assignee_id && newTicket.assignee_id !== authUser?.id) {
        const assignerName = authUser?.user_metadata?.name || "Quelqu'un";
        const projectNameForNotif = selectedProjectNameInternal || "un projet";

        try {
          await createNotification({
            user_id: newTicket.assignee_id,
            content: `${assignerName} vous a assigné la tâche "${newTicket.title}" dans le projet "${projectNameForNotif}".`,
            type: 'ticket_assigned',
            related_entity: 'ticket',
            related_id: newTicket.id,
            // Ajoute project_id_context à ta table notifications si tu veux un lien direct vers le projet
            // project_id_context: newTicket.project_id 
          });
        } catch (notifError) {
          console.error("Erreur création notification (assignation ticket):", notifError);
        }
      }
      // --- FIN NOTIFICATION ---

      onClose();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const showFullForm = !!selectedProjectIdInternal;
  const finalProjectName = selectedProjectNameInternal || initialProjectName;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: "circOut" }}
        >
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <div>
              <h2 className="text-xl font-orbitron text-star-white">Nouveau Ticket</h2>
              {finalProjectName && <p className="text-xs text-moon-gray font-medium">Projet : {finalProjectName}</p>}
            </div>
            <button onClick={onClose} className="text-moon-gray hover:text-star-white transition-colors disabled:opacity-50 p-1 rounded-full hover:bg-white/10" disabled={creating || loadingInternalMembers}>
              <X size={22} />
            </button>
          </div>

          {error && (
            <div className="p-3 mx-5 mt-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm flex-shrink-0">
              <AlertCircle size={18} /> <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-alert/70 hover:text-red-alert p-1 rounded-full hover:bg-red-alert/10"><X size={16}/></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
            {!initialProjectId && (
              <div>
                <label htmlFor="projectSelectorTicket" className="flex items-center text-sm text-moon-gray mb-1.5">
                  <Briefcase size={14} className="mr-2" /> Projet <span className="text-red-alert ml-1">*</span>
                </label>
                <select
                  id="projectSelectorTicket"
                  value={selectedProjectIdInternal || "null"}
                  onChange={handleProjectSelection}
                  className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'border-white/5 bg-white/5 cursor-not-allowed opacity-70' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`}
                  disabled={creating || loadingInternalMembers || !!initialProjectId}
                >
                  <option value="null">-- Sélectionner un projet --</option>
                  {availableProjects.map(proj => ( <option key={proj.id} value={proj.id}>{proj.name}</option> ))}
                </select>
              </div>
            )}

            {showFullForm && (
              <>
                <div>
                  <label htmlFor="ticketTitle" className="flex items-center text-sm text-moon-gray mb-1.5"><Type size={14} className="mr-2" /> Titre <span className="text-red-alert ml-1">*</span></label>
                  <input id="ticketTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Corriger le bug d'affichage mobile" className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating || loadingInternalMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers} required />
                </div>
                <div>
                  <label htmlFor="ticketDescription" className="flex items-center text-sm text-moon-gray mb-1.5"><Layers size={14} className="mr-2" /> Description <span className="text-red-alert ml-1">*</span></label>
                  <textarea id="ticketDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails de la tâche, étapes pour reproduire..." className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 min-h-[120px] resize-y ${creating || loadingInternalMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticketStatus" className="flex items-center text-sm text-moon-gray mb-1.5"><ChevronDown size={14} className="mr-2" /> Statut <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketStatus" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers}>
                      {Object.values(TicketStatus).map(s => (<option key={s} value={s}>{TicketStatusLabels[s]}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ticketPriority" className="flex items-center text-sm text-moon-gray mb-1.5"><AlertTriangle size={14} className="mr-2" /> Priorité <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketPriority" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers}>
                      <option value={TicketPriority.LOW}>Basse</option><option value={TicketPriority.MEDIUM}>Moyenne</option><option value={TicketPriority.HIGH}>Haute</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticketAssignee" className="flex items-center text-sm text-moon-gray mb-1.5"><User size={14} className="mr-2" /> Assigné à</label>
                    <select id="ticketAssignee" value={assigneeId || 'null'} onChange={(e) => setAssigneeId(e.target.value === 'null' ? null : e.target.value)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers || (showFullForm && internalProjectMembers.length === 0 && !loadingInternalMembers) ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers || (showFullForm && internalProjectMembers.length === 0 && !loadingInternalMembers)}>
                      <option value="null">{loadingInternalMembers ? 'Chargement membres...' : internalProjectMembers.length === 0 && selectedProjectIdInternal ? 'Aucun membre dans ce projet' : 'Non assigné'}</option>
                      {internalProjectMembers.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ticketDeadline" className="flex items-center text-sm text-moon-gray mb-1.5"><CalendarIcon size={14} className="mr-2" /> Deadline</label>
                    <input id="ticketDeadline" type="date" value={deadline || ''} onChange={(e) => setDeadline(e.target.value || null)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating || loadingInternalMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={creating || loadingInternalMembers} />
                  </div>
                </div>
                {/* TODO: Section Récurrence (commentée pour l'instant) */}
              </>
            )}

            <div className="pt-5 border-t border-white/10 flex justify-end gap-3 flex-shrink-0 mt-auto">
              <Button variant="ghost" type="button" onClick={onClose} disabled={creating || loadingInternalMembers}>Annuler</Button>
              <Button variant="primary" type="submit" disabled={creating || loadingInternalMembers || !selectedProjectIdInternal || !title.trim() || !description.trim()}>
                {creating ? <><Loader2 size={16} className="animate-spin mr-2"/> Création...</> : loadingInternalMembers ? 'Chargement...' : 'Créer le Ticket'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTicketModal;