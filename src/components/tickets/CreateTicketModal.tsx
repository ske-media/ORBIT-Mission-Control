// src/components/tickets/CreateTicketModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  Type,
  Layers,
  Briefcase,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Button from '../ui/Button';
import { TicketStatus, TicketPriority, TicketStatusLabels } from '../../types';
import { Database } from '../../types/supabase';
import { createTicket, getProjectMembers, createNotification } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectTypeForSelect = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>;
type NewTicketData = Omit<Database['public']['Tables']['tickets']['Insert'], 'id' | 'created_at' | 'updated_at'>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  // Assurez-vous que cette prop est mémoïsée dans le parent si elle est calculée dynamiquement.
  // Pour une liste statique ou chargée une fois, ce n'est pas un souci.
  availableProjects?: ProjectTypeForSelect[];
  initialStatus?: TicketStatus;
  onTicketCreated: (newTicket: TicketType) => void;
  defaultTitle?: string;
  defaultDescription?: string;
}

// Référence stable pour un tableau vide, si availableProjects n'est pas fourni
const STABLE_EMPTY_PROJECTS_ARRAY: ProjectTypeForSelect[] = [];

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose: onCloseProp, // Renommer pour s'assurer qu'elle est stable du parent (useCallback)
  projectId: initialProjectIdProp,
  projectName: initialProjectNameProp,
  availableProjects: availableProjectsProp = STABLE_EMPTY_PROJECTS_ARRAY, // Utilise la référence stable
  initialStatus: initialStatusProp,
  onTicketCreated: onTicketCreatedProp, // Renommer pour s'assurer qu'elle est stable du parent (useCallback)
  defaultTitle: defaultTitleProp = '',
  defaultDescription: defaultDescriptionProp = '',
}) => {
  const { user: authUser } = useAuth();

  // --- États du Formulaire ---
  // Initialisés à vide, seront remplis par l'effet d'ouverture
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [status, setStatus] = useState<TicketStatus>(TicketStatus.BACKLOG);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);

  // --- États Internes pour la Logique de la Modal ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<UserType[]>([]);

  // --- États UI ---
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);


  // Effet #1: Logique de RÉINITIALISATION DU FORMULAIRE et de CONFIGURATION INITIALE.
  // Cet effet ne doit s'exécuter QUE lorsque la modale PASSE DE FERMÉE À OUVERTE (`isOpen` devient `true`).
  // Il ne doit PAS se ré-exécuter si d'autres props changent PENDANT que la modale est déjà ouverte,
  // car cela écraserait la saisie de l'utilisateur.
  useEffect(() => {
    if (isOpen) {
      console.log('[CreateTicketModal] MODAL OPENING - Initializing form state.');

      // Réinitialise tous les champs du formulaire avec les props initiales/par défaut
      setTitle(defaultTitleProp);
      setDescription(defaultDescriptionProp);
      setPriority(TicketPriority.MEDIUM);
      setStatus(initialStatusProp || TicketStatus.BACKLOG);
      setAssigneeId(null); // Toujours réinitialiser
      setDeadline(null);   // Toujours réinitialiser
      setFormError(null);
      setIsSubmitting(false);

      // Définit le projet sélectionné basé sur initialProjectIdProp
      const currentPId = initialProjectIdProp || null;
      setSelectedProjectId(currentPId); // Ce setState va déclencher l'effet #2 si currentPId change

      // Détermine le nom du projet
      if (currentPId) {
        const projectFromArray = availableProjectsProp.find(p => p.id === currentPId);
        setSelectedProjectName(projectFromArray?.name || initialProjectNameProp || null);
      } else {
        setSelectedProjectName(initialProjectNameProp || null);
      }

      // Si aucun projet n'est sélectionné initialement, s'assurer que les membres sont vides
      // (l'effet #2 gèrera le chargement si un projet EST sélectionné)
      if (!currentPId) {
        setProjectMembers([]);
        setIsLoadingMembers(false);
      }
    }
    // Ce useEffect ne dépend QUE de `isOpen`.
    // Les props d'initialisation sont utilisées à l'intérieur mais ne doivent PAS
    // être des dépendances ici si on veut éviter la réinitialisation à chaque
    // re-render du parent (qui pourrait passer de nouvelles références pour ces props).
    // C'est un pattern courant pour les modales : initialiser à l'ouverture.
  }, [isOpen]);
  // Note: Si `defaultTitleProp`, etc., *doivent* pouvoir changer et mettre à jour le formulaire
  // *pendant que la modale est ouverte*, alors la logique devient plus complexe et
  // il faudrait les ajouter aux dépendances et gérer la mise à jour du titre
  // différemment (par exemple, ne mettre à jour `title` que si `defaultTitleProp` change *et*
  // que `title` est toujours égal à la *précédente* `defaultTitleProp`).
  // Pour une modale de création simple, le reset à l'ouverture est généralement suffisant.


  // Effet #2: CHARGEMENT DES MEMBRES du projet.
  // Se déclenche quand `isOpen` est vrai ET `selectedProjectId` (l'état interne) change.
  useEffect(() => {
    // Si la modale n'est pas ouverte, ou si aucun projet n'est sélectionné, ne rien faire ou nettoyer.
    if (!isOpen || !selectedProjectId) {
      // console.log('[CreateTicketModal] useEffect #2 - Not open or no project selected, clearing members.');
      setProjectMembers([]);
      setIsLoadingMembers(false);
      return; // Sortir tôt
    }

    // Si on arrive ici, la modale est ouverte ET un projet est sélectionné.
    const loadMembers = async (projectIdToLoad: string) => {
      console.log(`[CreateTicketModal] useEffect #2 - Loading members for project ID: ${projectIdToLoad}`);
      setIsLoadingMembers(true);
      setFormError(null);      // Réinitialiser l'erreur spécifique au chargement des membres
      setProjectMembers([]);   // Vider les membres précédents avant de charger
      try {
        const members = await getProjectMembers(projectIdToLoad);
        setProjectMembers(members.map(pm => pm.users).filter((user): user is UserType => user !== null));
      } catch (err) {
        console.error("Error fetching project members for modal:", err);
        setFormError("Impossible de charger les membres pour l'assignation.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers(selectedProjectId);

  }, [isOpen, selectedProjectId]); // Dépendances critiques et stables


  const handleProjectSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    if (newProjectId === "null" || !newProjectId) {
      setSelectedProjectId(null);
      setSelectedProjectName(null);
    } else {
      setSelectedProjectId(newProjectId); // Déclenchera l'effet #2
      const project = availableProjectsProp.find(p => p.id === newProjectId);
      setSelectedProjectName(project?.name || null);
    }
    setAssigneeId(null); // Toujours réinitialiser l'assigné lors du changement de projet
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProjectId) {
      setFormError("Veuillez sélectionner un projet.");
      return;
    }
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

    const ticketData: NewTicketData = {
      project_id: selectedProjectId,
      title: title.trim(),
      description: description.trim(),
      priority: priority.toLowerCase() as TicketPriority,
      status: status.toLowerCase() as TicketStatus,
      assignee_id: actualAssigneeId,
      deadline: deadline || null,
    };

    try {
      const newTicket = await createTicket(ticketData);
      onTicketCreatedProp(newTicket);

      if (newTicket.assignee_id && newTicket.assignee_id !== authUser?.id) {
        const assignerName = authUser?.user_metadata?.name || "Quelqu'un";
        const projectNameForNotif = selectedProjectName || "un projet";
        try {
          await createNotification({
            user_id: newTicket.assignee_id,
            content: `${assignerName} vous a assigné la tâche "${newTicket.title}" dans le projet "${projectNameForNotif}".`,
            type: 'ticket_assigned', related_entity: 'ticket', related_id: newTicket.id,
          });
        } catch (notifError) {
          console.error("Erreur création notification (assignation ticket):", notifError);
        }
      }
      onCloseProp();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setFormError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canShowFullForm = !!selectedProjectId;

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
              {selectedProjectName && <p className="text-xs text-moon-gray font-medium">Projet : {selectedProjectName}</p>}
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

          <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
            {!initialProjectIdProp && (
              <div>
                <label htmlFor="projectSelectorTicket" className="flex items-center text-sm text-moon-gray mb-1.5">
                  <Briefcase size={14} className="mr-2" /> Projet <span className="text-red-alert ml-1">*</span>
                </label>
                <select
                  id="projectSelectorTicket"
                  value={selectedProjectId || "null"}
                  onChange={handleProjectSelectionChange}
                  className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${isSubmitting || isLoadingMembers ? 'border-white/5 bg-white/5 cursor-not-allowed opacity-70' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`}
                  disabled={isSubmitting || isLoadingMembers || !!initialProjectIdProp}
                >
                  <option value="null">-- Sélectionner un projet --</option>
                  {availableProjectsProp.map(proj => ( <option key={proj.id} value={proj.id}>{proj.name}</option> ))}
                </select>
              </div>
            )}

            {canShowFullForm && (
              <>
                <div>
                  <label htmlFor="ticketTitle" className="flex items-center text-sm text-moon-gray mb-1.5"><Type size={14} className="mr-2" /> Titre <span className="text-red-alert ml-1">*</span></label>
                  <input id="ticketTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Corriger le bug d'affichage mobile" className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${isSubmitting || isLoadingMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={isSubmitting || isLoadingMembers} required />
                </div>
                <div>
                  <label htmlFor="ticketDescription" className="flex items-center text-sm text-moon-gray mb-1.5"><Layers size={14} className="mr-2" /> Description <span className="text-red-alert ml-1">*</span></label>
                  <textarea id="ticketDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails de la tâche, étapes pour reproduire..." className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 min-h-[120px] resize-y ${isSubmitting || isLoadingMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={isSubmitting || isLoadingMembers} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticketStatus" className="flex items-center text-sm text-moon-gray mb-1.5"><ChevronDown size={14} className="mr-2" /> Statut <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketStatus" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${isSubmitting || isLoadingMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={isSubmitting || isLoadingMembers}>
                      {Object.values(TicketStatus).map(s => (<option key={s} value={s}>{TicketStatusLabels[s]}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ticketPriority" className="flex items-center text-sm text-moon-gray mb-1.5"><AlertTriangle size={14} className="mr-2" /> Priorité <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketPriority" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${isSubmitting || isLoadingMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={isSubmitting || isLoadingMembers}>
                      <option value={TicketPriority.LOW}>Basse</option><option value={TicketPriority.MEDIUM}>Moyenne</option><option value={TicketPriority.HIGH}>Haute</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticketAssignee" className="flex items-center text-sm text-moon-gray mb-1.5"><User size={14} className="mr-2" /> Assigné à</label>
                    <select
                      id="ticketAssignee"
                      value={assigneeId || 'null'}
                      onChange={(e) => setAssigneeId(e.target.value === 'null' ? null : e.target.value)}
                      className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${isSubmitting || isLoadingMembers || (projectMembers.length === 0 && !isLoadingMembers && !!selectedProjectId) ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`}
                      disabled={isSubmitting || isLoadingMembers || (projectMembers.length === 0 && !isLoadingMembers && !!selectedProjectId) }
                    >
                      <option value="null">{isLoadingMembers ? 'Chargement membres...' : projectMembers.length === 0 && selectedProjectId ? 'Aucun membre disponible' : 'Non assigné'}</option>
                      {projectMembers.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ticketDeadline" className="flex items-center text-sm text-moon-gray mb-1.5"><CalendarIcon size={14} className="mr-2" /> Deadline</label>
                    <input id="ticketDeadline" type="date" value={deadline || ''} onChange={(e) => setDeadline(e.target.value || null)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${isSubmitting || isLoadingMembers ? 'opacity-70 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'}`} disabled={isSubmitting || isLoadingMembers} />
                  </div>
                </div>
              </>
            )}

            <div className="pt-5 border-t border-white/10 flex justify-end gap-3 flex-shrink-0 mt-auto">
              <Button variant="ghost" type="button" onClick={onCloseProp} disabled={isSubmitting || isLoadingMembers}>Annuler</Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || isLoadingMembers || !selectedProjectId || !title.trim() || !description.trim()}
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2"/> Création...</> : isLoadingMembers && !selectedProjectId ? 'Sélectionner projet...' : isLoadingMembers ? 'Chargement...' : 'Créer le Ticket'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTicketModal;