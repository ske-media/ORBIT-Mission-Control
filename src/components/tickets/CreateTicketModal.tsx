// src/components/tickets/CreateTicketModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Calendar as CalendarIcon, User, Tag, Type, Layers, Repeat, ChevronDown, AlertTriangle, Briefcase, Loader2 } from 'lucide-react'; // Ajout Briefcase, Loader2, AlertTriangle (déjà là)
import Button from '../ui/Button';
import { TicketStatus, TicketPriority, TicketStatusLabels } from '../../types';
import { Database } from '../../types/supabase';
import { createTicket, getProjectMembers } from '../../lib/supabase'; // Ajout getProjectMembers

type TicketType = Database['public']['Tables']['tickets']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectType = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>; // Seulement id et nom pour la liste des projets
type NewTicketData = Omit<Database['public']['Tables']['tickets']['Insert'], 'id' | 'created_at' | 'updated_at'>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string; // <<--- DEVIENT OPTIONNEL
  projectName?: string; // Toujours utile si projectId est fourni initialement
  availableProjects?: ProjectType[]; // <<--- NOUVEAU: Pour le sélecteur si projectId n'est pas fourni
  initialStatus?: TicketStatus;
  onTicketCreated: (newTicket: TicketType) => void;
  // projectMembers est supprimé des props
  defaultTitle?: string;
  defaultDescription?: string;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  projectId: initialProjectId, // Renommé pour clarté
  projectName: initialProjectName,
  availableProjects = [], // Valeur par défaut
  initialStatus,
  onTicketCreated,
  defaultTitle = '',
  defaultDescription = '',
}) => {
  // --- États du Formulaire ---
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [status, setStatus] = useState<TicketStatus>(initialStatus || TicketStatus.BACKLOG);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);

  // --- États Internes pour la Logique de la Modal ---
  const [selectedProjectIdInternal, setSelectedProjectIdInternal] = useState<string | null>(initialProjectId || null);
  const [selectedProjectNameInternal, setSelectedProjectNameInternal] = useState<string | null>(initialProjectName || null);
  const [internalProjectMembers, setInternalProjectMembers] = useState<UserType[]>([]);
  const [loadingInternalMembers, setLoadingInternalMembers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser/Réinitialiser quand la modal s'ouvre ou que les props clés changent
  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setPriority(TicketPriority.MEDIUM);
      setStatus(initialStatus || TicketStatus.BACKLOG);
      setAssigneeId(null);
      setDeadline(null);
      setError(null);
      setSelectedProjectIdInternal(initialProjectId || null); // Si un projectId est passé, on l'utilise
      setSelectedProjectNameInternal(initialProjectName || null);
      setInternalProjectMembers([]); // Vide les membres
      if (initialProjectId) { // Si un projectId est fourni, charge ses membres
        fetchMembersForProject(initialProjectId);
      }
    }
  }, [isOpen, defaultTitle, defaultDescription, initialStatus, initialProjectId, initialProjectName]);


  // Charger les membres quand selectedProjectIdInternal change (et n'est pas null)
  const fetchMembersForProject = useCallback(async (pid: string | null) => {
    if (!pid) {
      setInternalProjectMembers([]);
      return;
    }
    setLoadingInternalMembers(true);
    setError(null); // Reset error lors du chargement des membres
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
    // Ne charge que si ce n'est pas le projectId initial (déjà géré par le premier useEffect)
    if (selectedProjectIdInternal && selectedProjectIdInternal !== initialProjectId) {
      fetchMembersForProject(selectedProjectIdInternal);
    }
  }, [selectedProjectIdInternal, initialProjectId, fetchMembersForProject]);


  // Handler pour la sélection d'un projet dans la modal (si pas de projectId initial)
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
      // Le useEffect sur selectedProjectIdInternal déclenchera fetchMembersForProject
    }
  };

  // --- Soumission du Formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProjectIdInternal) {
      setError("Veuillez sélectionner un projet.");
      return;
    }
    if (!title.trim()) {
      setError("Le titre du ticket est requis.");
      return;
    }
    if (!description.trim()) {
      setError("La description du ticket est requise.");
      return;
    }

    setCreating(true);

    const ticketData: NewTicketData = {
      project_id: selectedProjectIdInternal, // Utilise l'ID de projet interne
      title: title.trim(),
      description: description.trim(),
      priority: priority.toLowerCase() as TicketPriority,
      status: status.toLowerCase() as TicketStatus,
      assignee_id: assigneeId === 'null' || assigneeId === '' ? null : assigneeId,
      deadline: deadline || null,
    };

    try {
      const newTicket = await createTicket(ticketData);
      onTicketCreated(newTicket);
      onClose();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const showProjectSelector = !initialProjectId && !selectedProjectIdInternal;
  const showFullForm = selectedProjectIdInternal; // Afficher le formulaire complet si un projet est sélectionné (initialement ou via sélecteur)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-white/10 shadow-xl"
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <div>
                <h2 className="text-xl font-orbitron text-star-white">Nouveau Ticket</h2>
                {selectedProjectNameInternal && <p className="text-xs text-moon-gray">Pour : {selectedProjectNameInternal}</p>}
            </div>
            <button onClick={onClose} className="text-moon-gray hover:text-star-white transition-colors disabled:opacity-50" disabled={creating || loadingInternalMembers}>
              <X size={24} />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 mx-5 mt-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm flex-shrink-0">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-alert/70 hover:text-red-alert"><X size={16}/></button>
            </div>
          )}

          {/* Form (Scrollable Content) */}
          <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* Sélecteur de Projet (si aucun projectId initial) */}
            {!initialProjectId && (
              <div>
                <label htmlFor="projectSelector" className="flex items-center text-sm text-moon-gray mb-1.5">
                  <Briefcase size={14} className="mr-2" /> Projet <span className="text-red-alert ml-1">*</span>
                </label>
                <select
                  id="projectSelector"
                  value={selectedProjectIdInternal || "null"}
                  onChange={handleProjectSelection}
                  className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'border-white/5 bg-white/5 cursor-wait' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`}
                  disabled={creating || loadingInternalMembers || !!initialProjectId} // Désactivé si initialProjectId est fourni
                >
                  <option value="null">-- Sélectionner un projet --</option>
                  {availableProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reste du formulaire (visible si un projet est sélectionné) */}
            {showFullForm && (
              <>
                {/* Titre */}
                <div>
                  <label htmlFor="ticketTitle" className="flex items-center text-sm text-moon-gray mb-1.5">
                    <Type size={14} className="mr-2" /> Titre <span className="text-red-alert ml-1">*</span>
                  </label>
                  <input id="ticketTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Corriger bug mobile" className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating || loadingInternalMembers ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers} required />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="ticketDescription" className="flex items-center text-sm text-moon-gray mb-1.5">
                    <Layers size={14} className="mr-2" /> Description <span className="text-red-alert ml-1">*</span>
                  </label>
                  <textarea id="ticketDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails..." className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 min-h-[100px] resize-y ${creating || loadingInternalMembers ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Statut */}
                  <div>
                    <label htmlFor="ticketStatus" className="flex items-center text-sm text-moon-gray mb-1.5"><ChevronDown size={14} className="mr-2" /> Statut <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketStatus" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers}>
                      {Object.values(TicketStatus).map(s => (<option key={s} value={s}>{TicketStatusLabels[s]}</option>))}
                    </select>
                  </div>
                  {/* Priorité */}
                  <div>
                    <label htmlFor="ticketPriority" className="flex items-center text-sm text-moon-gray mb-1.5"><AlertTriangle size={14} className="mr-2" /> Priorité <span className="text-red-alert ml-1">*</span></label>
                    <select id="ticketPriority" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers}>
                      <option value={TicketPriority.LOW}>Basse</option><option value={TicketPriority.MEDIUM}>Moyenne</option><option value={TicketPriority.HIGH}>Haute</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assigné à */}
                  <div>
                    <label htmlFor="ticketAssignee" className="flex items-center text-sm text-moon-gray mb-1.5"><User size={14} className="mr-2" /> Assigné à</label>
                    <select id="ticketAssignee" value={assigneeId || 'null'} onChange={(e) => setAssigneeId(e.target.value === 'null' ? null : e.target.value)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${creating || loadingInternalMembers || internalProjectMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers || internalProjectMembers.length === 0}>
                      <option value="null">{loadingInternalMembers ? 'Chargement membres...' : 'Non assigné'}</option>
                      {internalProjectMembers.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
                    </select>
                  </div>
                  {/* Deadline */}
                  <div>
                    <label htmlFor="ticketDeadline" className="flex items-center text-sm text-moon-gray mb-1.5"><CalendarIcon size={14} className="mr-2" /> Deadline</label>
                    <input id="ticketDeadline" type="date" value={deadline || ''} onChange={(e) => setDeadline(e.target.value || null)} className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${creating || loadingInternalMembers ? 'opacity-50 cursor-not-allowed' : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple'}`} disabled={creating || loadingInternalMembers} />
                  </div>
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex justify-end gap-3 flex-shrink-0 mt-auto">
              <Button variant="ghost" type="button" onClick={onClose} disabled={creating || loadingInternalMembers}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={creating || loadingInternalMembers || !selectedProjectIdInternal || !title.trim() || !description.trim()}>
                {creating ? 'Création...' : loadingInternalMembers ? 'Chargement...' : 'Créer le Ticket'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTicketModal;