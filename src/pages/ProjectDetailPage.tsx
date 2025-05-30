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
} from 'lucide-react';
import { motion } from 'framer-motion';

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
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProjectDetails from '../components/projects/ProjectDetails';

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

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
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

  const fetchData = useCallback(async (showLoadingSpinner = true) => {
    if (!projectId) {
      dispatch({ type: 'FETCH_ERROR', payload: "ID de projet manquant." });
      return;
    }
    if (showLoadingSpinner) dispatch({ type: 'FETCH_START' });
    setOperationError(null); setOperationSuccess(null);

    try {
      const [projectData, ticketsData, membersData, currentUserProfileData] = await Promise.all([
        getProjectById(projectId),
        getTicketsByProject(projectId),
        getProjectMembers(projectId),
        getCurrentUserProfile(),
      ]);

      if (!projectData) throw new Error("Projet non trouvé ou accès refusé.");

      const userIdsToFetch = new Set<string>();
      if (currentUserProfileData?.id) userIdsToFetch.add(currentUserProfileData.id);
      projectData.owner_id && userIdsToFetch.add(projectData.owner_id);
      (membersData || []).forEach(member => member.user_id && userIdsToFetch.add(member.user_id)); // Sécurisation
      (ticketsData || []).forEach(ticket => ticket.assignee_id && userIdsToFetch.add(ticket.assignee_id)); // Sécurisation

      let usersFromDb: UserProfile[] = [];
      if (userIdsToFetch.size > 0) {
        const { data, error: usersError } = await supabase.from('users').select('*').in('id', Array.from(userIdsToFetch));
        if (usersError) console.warn("Erreur lors du fetch des détails utilisateurs:", usersError.message);
        else usersFromDb = data || [];
      }

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          project: projectData,
          tickets: ticketsData || [], // Assurer que c'est un tableau
          members: membersData || [],   // Assurer que c'est un tableau
          currentUserProfile: currentUserProfileData,
          usersFromDb
        },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'Erreur chargement projet.' });
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      [TicketStatus.BACKLOG]: [], [TicketStatus.TODO]: [], [TicketStatus.IN_PROGRESS]: [],
      [TicketStatus.REVIEW]: [], [TicketStatus.DONE]: [],
    };
    // Sécurisation : filteredTickets est maintenant garanti d'être un tableau
    filteredTickets.forEach(ticket => {
      const statusKey = ticket.status.toLowerCase() as TicketStatus;
      if (grouped[statusKey]) {
          grouped[statusKey].push(ticket);
      } else {
          console.warn(`Ticket ${ticket.id} has unknown status: ${ticket.status}, falling back to backlog.`);
          grouped[TicketStatus.BACKLOG].push(ticket);
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

  const handleAssignToMe = useCallback(async (ticketId: string): Promise<TicketType | null | void> => {
    const currentAuthUserId = currentUserProfile?.id || authUser?.id;
    if (!currentAuthUserId) {
      setOperationError("Utilisateur non identifié."); return null;
    }
    return handleTicketUpdate(ticketId, { assignee_id: currentAuthUserId });
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
    if (!projectId) return;
    setOperationSuccess(null); setOperationError(null);
    try {
      const membersData = await getProjectMembers(projectId);
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
  }, [projectId, dispatch, userMap]);


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
          <Button variant="primary" size="sm" onClick={() => fetchData(true)} iconLeft={<RefreshCw size={14}/>}>Réessayer</Button>
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
    <div className="p-6 md:p-8 flex flex-col h-[calc(100vh-var(--header-height,4rem))]">
      {/* ... (Notifications d'opération et Project Header comme avant) ... */}
      {operationError && (
        <div className="fixed top-20 right-8 z-[100] mb-4 p-3 bg-red-alert/20 text-red-alert border border-red-alert/30 rounded-lg flex items-center gap-2 text-sm shadow-lg animate-pulse">
          <AlertCircle size={18} /> <span className='flex-1'>{operationError}</span>
          <button onClick={() => setOperationError(null)} className="ml-auto text-red-alert/80 hover:text-red-alert flex-shrink-0"><IconX size={16}/></button>
        </div>
      )}
      {operationSuccess && (
        <div className="fixed top-20 right-8 z-[100] mb-4 p-3 bg-green-success/20 text-green-success border border-green-success/30 rounded-lg flex items-center gap-2 text-sm shadow-lg animate-pulse">
          <CheckCircle size={18} /> <span className='flex-1'>{operationSuccess}</span>
          <button onClick={() => setOperationSuccess(null)} className="ml-auto text-green-success/80 hover:text-green-success flex-shrink-0"><IconX size={16}/></button>
        </div>
      )}

      <ProjectDetails 
        project={project} 
        onProjectArchived={() => {
          fetchData(true);
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

      <div className="flex-1 overflow-x-auto pb-4 min-h-[300px]">
        <div className="flex gap-4 md:gap-6 min-w-max h-full">
          {Object.values(TicketStatus).map(statusKey => (
            <KanbanColumn
              key={statusKey}
              status={statusKey}
              title={TicketStatusLabels[statusKey]}
              tickets={ticketsByStatus[statusKey] || []} // Sécurisation
              onTicketClick={handleTicketClick}
              onAddTicket={handleOpenTicketFormModal}
              userMap={userMap}
              currentUserId={currentUserProfile?.id || authUser?.id}
              isLoadingTickets={loadingPage && !initialDataLoaded}
            />
          ))}
        </div>
      </div>

      {selectedTicket && project && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          userMap={userMap}
          projectData={project}
        />
      )}

      {showMembersModal && project && projectId && (currentUserProfile || authUser) && (
        <ProjectMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          projectId={projectId}
          projectName={project.name}
          ownerId={project.owner_id}
          currentUserId={currentUserProfile?.id || authUser?.id || ''}
          initialMembers={projectMembers || []} // Sécurisation
          onMembersUpdate={handleMembersUpdate}
        />
      )}

      {showTicketFormModal && project && projectId && (
        <TicketFormModal
          isOpen={showTicketFormModal}
          onClose={handleCloseTicketFormModal}
          projectId={projectId}
          projectName={project.name}
          initialStatus={initialTicketStatusForModal}
          onTicketCreated={handleTicketCreatedInPage}
          // availableProjects n'est pas nécessaire ici, le projet est fixe
        />
      )}
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