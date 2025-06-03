// src/pages/ProjectDetailPage.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ListFilter,
  Users,
  Layers,
  AlertTriangle,
  Plus,
  AlertCircle,
  UserCog,
  RefreshCw,
  X as IconX,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { TicketStatus, TicketStatusLabels, TicketPriority, Ticket as AppTicketType } from '../types';
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import ProjectMembersModal from '../components/projects/ProjectMembersModal';
import TicketFormModal from '../components/tickets/CreateTicketModal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  getProjectById,
  getTicketsByProject,
  getProjectMembers,
  getCurrentUserProfile,
  updateTicket,
  createNotification,
  supabase,
  ProjectMemberWithUser,
  getOrganizationProject,
  deleteOrganizationProject,
  OrganizationProject,
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProjectDetails from '../components/projects/ProjectDetails';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';

type ProjectType = Database['public']['Tables']['projects']['Row'];
type UserProfile = Database['public']['Tables']['users']['Row'];
type TicketType = Database['public']['Tables']['tickets']['Row'];

interface ProjectDetailState {
  project: ProjectType | null;
  tickets: TicketType[]; // Assurer que c'est toujours un tableau
  projectMembers: ProjectMemberWithUser[];
  currentUserProfile: UserProfile | null;
  userMap: Record<string, UserProfile>;
  loadingPage: boolean;
  errorPage: string | null;
  initialDataLoaded: boolean;
}

const initialState: ProjectDetailState = {
  project: null,
  tickets: [], // Initialisé comme un tableau vide
  projectMembers: [],
  currentUserProfile: null,
  userMap: {},
  loadingPage: true,
  errorPage: null,
  initialDataLoaded: false,
};

type ProjectDetailAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { project: ProjectType; tickets: TicketType[]; members: ProjectMemberWithUser[]; currentUserProfile: UserProfile | null; usersFromDb: UserProfile[] } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_TICKET_IN_LIST'; payload: TicketType }
  | { type: 'ADD_TICKET_TO_LIST'; payload: TicketType }
  | { type: 'UPDATE_PROJECT_MEMBERS'; payload: { members: ProjectMemberWithUser[]; newUsersToMap: UserProfile[] } };

function projectDetailReducer(state: ProjectDetailState, action: ProjectDetailAction): ProjectDetailState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loadingPage: true, errorPage: null };
    case 'FETCH_SUCCESS':
      const newUserMap: Record<string, UserProfile> = {};
      (action.payload.members || []).forEach(member => { // Sécurisation avec || []
        if (member.users) newUserMap[member.users.id] = member.users;
      });
      if (action.payload.currentUserProfile) {
        newUserMap[action.payload.currentUserProfile.id] = action.payload.currentUserProfile;
      }
      (action.payload.usersFromDb || []).forEach(user => { // Sécurisation
          if (!newUserMap[user.id]) newUserMap[user.id] = user;
      });
      return {
        ...state,
        loadingPage: false,
        project: action.payload.project,
        tickets: action.payload.tickets || [], // Assurer que c'est un tableau
        projectMembers: action.payload.members || [], // Assurer que c'est un tableau
        currentUserProfile: action.payload.currentUserProfile,
        userMap: newUserMap,
        initialDataLoaded: true,
      };
    case 'FETCH_ERROR':
      return { ...state, loadingPage: false, errorPage: action.payload, initialDataLoaded: true, project: null, tickets: [], projectMembers: [] }; // Reset des données en cas d'erreur
    case 'UPDATE_TICKET_IN_LIST':
      return {
        ...state,
        tickets: (state.tickets || []).map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'ADD_TICKET_TO_LIST':
      const updatedUserMapForAdd = { ...state.userMap };
      // Logique pour ajouter l'assigné à userMap si nécessaire (déjà géré dans handleTicketCreatedInPage)
      return {
        ...state,
        userMap: updatedUserMapForAdd,
        tickets: [action.payload, ...(state.tickets || [])].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      };
    case 'UPDATE_PROJECT_MEMBERS': {
      const finalUserMap = { ...state.userMap };
      (action.payload.newUsersToMap || []).forEach(user => {
        if (!finalUserMap[user.id]) finalUserMap[user.id] = user;
      });
      (action.payload.members || []).forEach(member => {
        if (member.users && !finalUserMap[member.users.id]) finalUserMap[member.users.id] = member.users;
      });
      return { ...state, projectMembers: action.payload.members || [], userMap: finalUserMap };
    }
    default:
      return state;
  }
}

export const ProjectDetailPage: React.FC = () => {
  const { organizationId, projectId } = useParams<{ organizationId: string; projectId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [state, dispatch] = useReducer(projectDetailReducer, initialState);
  const {
    project,
    tickets, // Vient de state, initialisé à []
    projectMembers,
    currentUserProfile,
    userMap,
    loadingPage,
    errorPage,
    initialDataLoaded,
  } = state;

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTicketFormModal, setShowTicketFormModal] = useState(false);
  const [initialTicketStatusForModal, setInitialTicketStatusForModal] = useState<TicketStatus | undefined>(undefined);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchProject = async () => {
    if (!organizationId || !projectId) return;

    try {
      setOperationError(null); setOperationSuccess(null);
      const data = await getOrganizationProject(organizationId, projectId);
      if (!data) throw new Error("Projet non trouvé ou accès refusé.");
      setOperationSuccess("Projet chargé avec succès!");

      const userIdsToFetch = new Set<string>();
      if (data.owner_id) userIdsToFetch.add(data.owner_id);
      (projectMembers || []).forEach(member => member.user_id && userIdsToFetch.add(member.user_id));
      (tickets || []).forEach(ticket => ticket.assignee_id && userIdsToFetch.add(ticket.assignee_id));

      let usersFromDb: UserProfile[] = [];
      if (userIdsToFetch.size > 0) {
        const { data: usersData, error: usersError } = await supabase.from('users').select('*').in('id', Array.from(userIdsToFetch));
        if (usersError) console.warn("Erreur lors du fetch des détails utilisateurs:", usersError.message);
        else usersFromDb = usersData || [];
      }

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          project: data,
          tickets: tickets || [],
          members: projectMembers || [],
          currentUserProfile: currentUserProfile,
          usersFromDb
        },
      });
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Erreur chargement projet.');
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'Erreur chargement projet.' });
    }
  };

  useEffect(() => {
    fetchProject();
  }, [organizationId, projectId]);

  const filteredTickets = useMemo(() => {
    // Sécurisation : s'assurer que tickets est bien un tableau avant de le spreader
    let tempTickets = Array.isArray(tickets) ? [...tickets] : [];

    if (filterMine) {
      const currentAuthUserId = currentUserProfile?.id || authUser?.id;
      if (currentAuthUserId) {
        tempTickets = tempTickets.filter(ticket => ticket.assignee_id === currentAuthUserId);
      }
    }
    if (filterUrgent) {
      tempTickets = tempTickets.filter(ticket => ticket.priority === TicketPriority.HIGH && ticket.status !== TicketStatus.DONE);
    }
    return tempTickets;
  }, [tickets, filterMine, filterUrgent, currentUserProfile, authUser]);

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, TicketType[]> = {
      [TicketStatus.TODO]: [], 
      [TicketStatus.IN_PROGRESS]: [],
      [TicketStatus.REVIEW]: [], 
      [TicketStatus.DONE]: []
    };
    filteredTickets.forEach(ticket => {
      const statusKey = ticket.status.toLowerCase() as TicketStatus;
      if (grouped[statusKey]) {
        grouped[statusKey].push(ticket);
      } else {
        // Si le statut n'existe pas, on met dans TODO par défaut
        grouped[TicketStatus.TODO].push(ticket);
      }
    });
    return grouped;
  }, [filteredTickets]);

  const isOwnerOrEditor = useMemo(() => {
    const currentAuthUserId = currentUserProfile?.id || authUser?.id;
    if (!project || !currentAuthUserId) return false;
    if (project.owner_id === currentAuthUserId) return true;
    return (projectMembers || []).some( // Sécurisation
      member => member.user_id === currentAuthUserId && (member.role === 'owner' || member.role === 'editor')
    );
  }, [project, projectMembers, currentUserProfile, authUser]);

  const totalFilteredTasks = useMemo(() => filteredTickets.length, [filteredTickets]); // Ligne 217
  const completedFilteredTasks = useMemo(() => filteredTickets.filter(t => t.status === TicketStatus.DONE).length, [filteredTickets]);

  const completion = useMemo(() => totalFilteredTasks === 0 ? 0 : Math.round((completedFilteredTasks / totalFilteredTasks) * 100), [completedFilteredTasks, totalFilteredTasks]);
  const urgentCount = useMemo(() => filteredTickets.filter(t => t.priority === TicketPriority.HIGH && t.status !== TicketStatus.DONE).length, [filteredTickets]);

  const formatDeadline = useCallback((dateString: string | null): string => { /* ... inchangé ... */
    if (!dateString) return 'N/A';
    try { return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString)); }
    catch { return "Date invalide"; }
  }, []);

  const handleTicketClick = useCallback((ticket: TicketType) => setSelectedTicket(ticket), []);

  const handleTicketUpdate = useCallback(async (ticketId: string, updates: Partial<TicketType>): Promise<TicketType | null> => {
    const ticketAvantUpdate = (tickets || []).find(t => t.id === ticketId); // Sécurisation
    if (!ticketAvantUpdate) {
      setOperationError("Erreur: Ticket original non trouvé."); return null;
    }
    setUpdatingTicketId(ticketId); setOperationError(null); setOperationSuccess(null);
    const optimisticUpdatedTicket = { ...ticketAvantUpdate, ...updates } as TicketType;
    dispatch({ type: 'UPDATE_TICKET_IN_LIST', payload: optimisticUpdatedTicket });
    if (selectedTicket?.id === ticketId) setSelectedTicket(optimisticUpdatedTicket);

    try {
      const ticketApresUpdate = await updateTicket(ticketId, updates);
      if (!ticketApresUpdate) throw new Error("La mise à jour du ticket a échoué.");
      dispatch({ type: 'UPDATE_TICKET_IN_LIST', payload: ticketApresUpdate });
      if (selectedTicket?.id === ticketId) setSelectedTicket(ticketApresUpdate);
      setOperationSuccess("Ticket mis à jour !");

      if (ticketAvantUpdate.assignee_id !== ticketApresUpdate.assignee_id &&
          ticketApresUpdate.assignee_id && ticketApresUpdate.assignee_id !== authUser?.id && project) {
        const assignerName = currentUserProfile?.name || authUser?.user_metadata?.name || "Quelqu'un";
        try {
          await createNotification({
            user_id: ticketApresUpdate.assignee_id,
            content: `${assignerName} vous a assigné la tâche "${ticketApresUpdate.title}" dans le projet "${project.name}".`,
            type: 'ticket_assigned', related_entity: 'ticket', related_id: ticketApresUpdate.id,
          });
        } catch (notifError) { console.error("Erreur création notif (assignation):", notifError); }
      }
      return ticketApresUpdate;
    } catch (err) {
      setOperationError(`Erreur MàJ: ${err instanceof Error ? err.message : 'Inconnue'}`);
      dispatch({ type: 'UPDATE_TICKET_IN_LIST', payload: ticketAvantUpdate });
      if (selectedTicket?.id === ticketId) setSelectedTicket(ticketAvantUpdate);
      return null;
    } finally {
      setUpdatingTicketId(null);
      setTimeout(() => { setOperationSuccess(null); setOperationError(null); }, 3000);
    }
  }, [tickets, selectedTicket, authUser, currentUserProfile, project, dispatch]);

  const handleStatusChange = useCallback(async (ticketId: string, newStatus: TicketStatus) => {
    await handleTicketUpdate(ticketId, { status: newStatus.toLowerCase() as TicketType['status'] });
  }, [handleTicketUpdate]);

  const handleAssignToMe = useCallback(async (ticketId: string, userId?: string): Promise<TicketType | null | void> => {
    const assigneeId = userId || currentUserProfile?.id || authUser?.id;
    if (!assigneeId) {
      setOperationError("Utilisateur non identifié."); return null;
    }
    return handleTicketUpdate(ticketId, { assignee_id: assigneeId });
  }, [currentUserProfile, authUser, handleTicketUpdate]);

  const handleOpenTicketFormModal = useCallback((status?: TicketStatus) => {
    setInitialTicketStatusForModal(status);
    setShowTicketFormModal(true);
    setOperationError(null);
  }, []);

  const handleCloseTicketFormModal = useCallback(() => {
    setShowTicketFormModal(false);
    setInitialTicketStatusForModal(undefined);
  }, []);

  const handleTicketCreatedInPage = useCallback(async (newTicket: TicketType) => {
    dispatch({ type: 'ADD_TICKET_TO_LIST', payload: newTicket });
    setOperationSuccess("Nouveau ticket créé !");
    setTimeout(() => setOperationSuccess(null), 3000);

    if (newTicket.assignee_id && !userMap[newTicket.assignee_id]) {
      try {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', newTicket.assignee_id)
          .single();
        if (userError) throw userError;
        if (newUser) {
          // Mettre à jour la userMap via le reducer
          // L'action UPDATE_PROJECT_MEMBERS peut être réutilisée ou une nouvelle action USER_MAP_ADD_USER créée
          dispatch({ type: 'UPDATE_PROJECT_MEMBERS', payload: { members: projectMembers || [], newUsersToMap: [newUser] } });
        }
      } catch(err) {
        console.warn("Impossible de fetcher les détails du nouvel assigné:", err);
      }
    }
  }, [dispatch, userMap, projectMembers]);


  const handleMembersUpdate = useCallback(async () => {
    if (!organizationId) return;
    setOperationSuccess(null); setOperationError(null);
    try {
      const membersData = await getProjectMembers(organizationId);
      const newUserIdsToFetch = (membersData || [])
        .map(m => m.user_id)
        .filter(id => id && !userMap[id]);

      let newUsersFetched: UserProfile[] = [];
      if (newUserIdsToFetch.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', newUserIdsToFetch as string[]);
        if (usersError) throw usersError;
        newUsersFetched = usersData || [];
      }
      dispatch({ type: 'UPDATE_PROJECT_MEMBERS', payload: { members: membersData || [], newUsersToMap: newUsersFetched } });
      setOperationSuccess("Liste des membres mise à jour.");
    } catch (err) {
      setOperationError(`Erreur MàJ membres: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    setTimeout(() => { setOperationSuccess(null); setOperationError(null); }, 3000);
  }, [organizationId, dispatch, userMap]);

  const handleTicketUpdated = (updatedTicket: TicketType) => {
    dispatch({ type: 'UPDATE_TICKET_IN_LIST', payload: updatedTicket });
  };

  const handleBack = () => {
    navigate(`/organizations/${organizationId}`);
  };

  const handleEdit = () => {
    // TODO: Implémenter l'édition du projet
    toast.info('Fonctionnalité d\'édition à venir');
  };

  const handleDelete = async () => {
    if (!organizationId || !projectId) return;

    try {
      await deleteOrganizationProject(organizationId, projectId);
      toast.success('Projet supprimé avec succès');
      navigate(`/organizations/${organizationId}`);
    } catch (error) {
      toast.error('Erreur lors de la suppression du projet');
      console.error('Error deleting project:', error);
    }
  };

  // --- Render Logic ---
  if (!initialDataLoaded && loadingPage) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
        <Loader2 className="w-12 h-12 text-nebula-purple animate-spin" />
      </div>
    );
  }

  if (errorPage && !project) { // Si erreur ET project est null (erreur bloquante initiale)
    return (
      <div className="p-8 text-center">
        <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
          <AlertCircle size={32} /> <span>{errorPage}</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="mr-2">Retour projets</Button>
          <Button variant="primary" size="sm" onClick={() => fetchProject()} iconLeft={<RefreshCw size={14}/>}>Réessayer</Button>
        </div>
      </div>
    );
  }

  // Modifié pour s'afficher si pas de projet ET pas en chargement (et pas d'erreurPage, car géré au-dessus)
  if (!project && !loadingPage && !errorPage) {
    return (
        <div className="p-8 text-center">
             <div className="p-4 inline-flex flex-col items-center bg-deep-space text-moon-gray border border-white/10 rounded-lg gap-3">
               <AlertTriangle size={32} />
               <span>Projet introuvable ou les données ne sont pas encore disponibles.</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>Retour projets</Button>
             </div>
        </div>
    );
  }

  // Si project est null mais qu'on est en chargement, le premier if s'en charge.
  // Si on arrive ici, project devrait être non-null ou une erreur bloquante aurait été affichée.
  if (!project) {
      // Ce cas ne devrait plus être atteint si la logique ci-dessus est correcte,
      // mais c'est une sécurité pour éviter de rendre le reste avec un projet null.
      // On pourrait aussi afficher un loader plus discret ici ou un message d'attente.
      console.warn("[ProjectDetailPage] Reached fallback return; project is null but no loading/errorPage state active.");
      return (
        <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-nebula-purple animate-spin" />
            <p className="text-moon-gray mt-2">Chargement des détails du projet...</p>
        </div>
      );
  }


  // --- Affichage Principal ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-moon-gray hover:text-star-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-orbitron text-star-white">{project.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleEdit}
            variant="outline"
            className="text-moon-gray hover:text-star-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="destructive"
            className="text-red-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <ProjectDetails 
        project={project} 
        onProjectArchived={() => {
          fetchProject();
          navigate('/projects');
        }} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 flex-shrink-0">
        <StatCard icon={<Calendar size={18} />} title="Deadline" value={formatDeadline(project.deadline)} />
        <StatCard icon={<Layers size={18} />} title="Progression" value={`${completion}%`} subValue={`${completedFilteredTasks}/${totalFilteredTasks} tâches`} >
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-nebula-purple transition-width duration-500" style={{ width: `${completion}%` }}></div>
          </div>
        </StatCard>
        <StatCard icon={<Users size={18} />} title="Équipe" value={`${(projectMembers || []).length} membre${(projectMembers || []).length !== 1 ? 's' : ''}`}>
          <div className="flex -space-x-2 overflow-hidden mt-1.5 items-center">
            {(projectMembers || []).slice(0, 5).map(member =>
              member.users ? <Avatar key={member.user_id} src={member.users.avatar || ''} alt={member.users.name || ''} size="sm" className="border-2 border-deep-space" title={`${member.users.name || ''} (${member.role})`} /> : null
            )}
            {(projectMembers || []).length > 5 && <div key="plus-members" className="w-8 h-8 rounded-full bg-white/10 text-star-white flex items-center justify-center text-xs border-2 border-deep-space z-10">+{ (projectMembers || []).length - 5}</div>}
            {isOwnerOrEditor && <Button variant="ghost" size="xs" iconLeft={<UserCog size={12} />} onClick={() => setShowMembersModal(true)} className="ml-auto !p-1 text-moon-gray hover:text-nebula-purple" title="Gérer les membres"/>}
          </div>
        </StatCard>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-orbitron text-star-white">Kanban</h2>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1 bg-red-alert/20 text-red-alert px-2 py-0.5 rounded-full text-xs">
              <AlertTriangle size={12} />{urgentCount} urgent{urgentCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setFilterMine(!filterMine)} className={`!px-2.5 ${filterMine ? 'bg-nebula-purple/20 text-nebula-purple' : 'text-moon-gray hover:text-star-white'}`} title="Filtrer mes tâches"><ListFilter size={14} className="sm:mr-1.5"/> <span className="hidden sm:inline">Mes tâches</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setFilterUrgent(!filterUrgent)} className={`!px-2.5 ${filterUrgent ? 'bg-red-alert/20 text-red-alert' : 'text-moon-gray hover:text-star-white'}`} title="Filtrer les tâches urgentes"><AlertTriangle size={14} className="sm:mr-1.5"/> <span className="hidden sm:inline">Urgentes</span></Button>
          {isOwnerOrEditor && <Button variant="primary" size="sm" iconLeft={<Plus size={14}/>} onClick={() => handleOpenTicketFormModal()} title="Ajouter un nouveau ticket">Ticket</Button>}
        </div>
      </div>

      {/* Section Kanban */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-orbitron text-star-white">Tableau Kanban</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTicketFormModal(true)}
              className="text-moon-gray hover:text-star-white"
            >
              <Plus size={16} className="mr-1" />
              Nouvelle tâche
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {Object.entries(ticketsByStatus).map(([status, tickets]) => (
                <motion.div
                  key={status}
                  className="w-72 flex-shrink-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-deep-space rounded-lg border border-white/10 p-4 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-star-white">
                        {TicketStatusLabels[status as keyof typeof TicketStatus]}
                      </h3>
                      <span className="text-sm text-moon-gray bg-white/5 px-2 py-1 rounded-full">
                        {tickets.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <motion.div
                          key={ticket.id}
                          className="bg-space-black/40 p-4 rounded-lg border border-white/5 hover:border-nebula-purple/30 transition-colors cursor-pointer"
                          onClick={() => handleTicketClick(ticket)}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-star-white font-medium truncate">{ticket.title}</h4>
                              <p className="text-moon-gray text-sm mt-1 line-clamp-2">{ticket.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  ticket.priority === 'high' 
                                    ? 'bg-red-alert/20 text-red-alert' 
                                    : ticket.priority === 'medium'
                                    ? 'bg-yellow-warning/20 text-yellow-warning'
                                    : 'bg-green-success/20 text-green-success'
                                }`}>
                                  {TicketPriority[ticket.priority as keyof typeof TicketPriority]}
                                </span>
                                {ticket.deadline && (
                                  <span className="text-xs text-moon-gray flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(ticket.deadline).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ticket.assignee_id && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                                  <span className="text-xs text-nebula-purple">
                                    {ticket.assignee_id.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {tickets.length === 0 && (
                        <div className="text-center py-8 text-moon-gray border border-dashed border-white/10 rounded-lg">
                          Aucune tâche
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-deep-space to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-deep-space to-transparent pointer-events-none"></div>
        </div>
      </div>

      {selectedTicket && project && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          onTicketUpdated={handleTicketUpdated}
          userMap={userMap}
          projectData={project}
        />
      )}

      {showMembersModal && project && organizationId && (currentUserProfile || authUser) && (
        <ProjectMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          projectId={organizationId}
          projectName={project.name}
          ownerId={project.owner_id}
          currentUserId={currentUserProfile?.id || authUser?.id || ''}
          initialMembers={projectMembers || []} // Sécurisation
          onMembersUpdate={handleMembersUpdate}
        />
      )}

      {showTicketFormModal && project && organizationId && (
        <TicketFormModal
          isOpen={showTicketFormModal}
          onClose={handleCloseTicketFormModal}
          projectId={organizationId}
          projectName={project.name}
          initialStatus={initialTicketStatusForModal}
          onTicketCreated={handleTicketCreatedInPage}
          // availableProjects n'est pas nécessaire ici, le projet est fixe
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-deep-space border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-star-white">
              Supprimer le projet
            </AlertDialogTitle>
            <AlertDialogDescription className="text-moon-gray">
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-space-black text-star-white hover:bg-space-black/80">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// StatCard est défini ci-dessous (inchangé)
const StatCard: React.FC<{icon: React.ReactNode; title: string; value: string | number; subValue?: string; children?: React.ReactNode}> = ({ icon, title, value, subValue, children }) => (
  <motion.div
    className="bg-deep-space rounded-xl p-4 border border-white/10"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-2 mb-1 text-moon-gray text-sm">
      {icon} {title}
    </div>
    <p className="text-xl md:text-2xl font-orbitron text-star-white">{value}</p>
    {subValue && <p className="text-xs text-moon-gray/80">{subValue}</p>}
    {children}
  </motion.div>
);

export default ProjectDetailPage;