// src/pages/ProjectDetailPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  X as IconX // Renommé pour éviter conflit si X est utilisé ailleurs
} from 'lucide-react';
import { TicketStatus, TicketStatusLabels } from '../types'; // Assure-toi que ce chemin est correct
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import ProjectMembersModal from '../components/projects/ProjectMembersModal';
import CreateTicketModal from '../components/tickets/CreateTicketModal'; // <<--- IMPORTÉ ICI
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  getProjectById,
  getTicketsByProject,
  getProjectMembers,
  getCurrentUserProfile,
  updateTicket,
  supabase, // Pour la requête batch des assignees manquants
  ProjectMemberWithUser // Type exporté de supabase.ts
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';

// Types spécifiques à cette page
type ProjectType = Database['public']['Tables']['projects']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type TicketType = Database['public']['Tables']['tickets']['Row'];

const ProjectDetailPage: React.FC = () => {
  // --- SECTION 1: APPEL DE TOUS LES HOOKS ---

  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [project, setProject] = useState<ProjectType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberWithUser[]>([]);
  const [currentUserProfile, setCurrentUserProfileState] = useState<UserType | null>(null);
  const [userMap, setUserMap] = useState<Record<string, UserType>>({});
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour CreateTicketModal
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [initialTicketStatus, setInitialTicketStatus] = useState<TicketStatus | undefined>(undefined);

  // Hooks mémoïsés
  const filteredTickets = useMemo(() => {
    const currentUserId = currentUserProfile?.id || authUser?.id;
    return tickets.filter(ticket => {
      if (filterMine && currentUserId && ticket.assignee_id !== currentUserId) return false;
      if (filterUrgent && ticket.priority === 'high' && ticket.status !== 'done') return false; // Modifié ici pour ne pas filtrer les 'done'
      return true;
    });
  }, [tickets, filterMine, filterUrgent, currentUserProfile, authUser]);

  const ticketsByStatus = useMemo(() => {
    return Object.values(TicketStatus).reduce((acc, status) => {
      acc[status] = filteredTickets.filter(ticket => ticket.status === status.toLowerCase());
      return acc;
    }, {} as Record<TicketStatus, TicketType[]>);
  }, [filteredTickets]);

  const isOwner = useMemo(() => {
    if (!project || (!authUser && !currentUserProfile)) return false;
    const currentActualUserId = currentUserProfile?.id || authUser?.id;
    return !!project.owner_id && !!currentActualUserId && project.owner_id === currentActualUserId;
  }, [project, currentUserProfile, authUser]);

  const completion = useMemo(() => {
    if (!filteredTickets.length) return 0;
    const completed = filteredTickets.filter(t => t.status === 'done').length;
    return Math.round((completed / filteredTickets.length) * 100);
  }, [filteredTickets]);

  const urgentCount = useMemo(() => {
      return filteredTickets.filter(t => t.priority === 'high' && t.status !== 'done').length;
  }, [filteredTickets]);

  // Hook de rappel pour le fetch des données
  const fetchData = useCallback(async () => {
    if (!projectId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(projectId)) {
      setError("ID de projet invalide ou manquant.");
      setLoading(false);
      setProject(null);
      return;
    }
    setLoading(true);
    setError(null);
    setProjectMembers([]);
    try {
      const [profileResult, projectResult, ticketsResult, membersResult] = await Promise.allSettled([
        getCurrentUserProfile(),
        getProjectById(projectId),
        getTicketsByProject(projectId),
        getProjectMembers(projectId)
      ]);

      let resolvedCurrentUserProfile: UserType | null = null;
      if (profileResult.status === 'fulfilled') {
        resolvedCurrentUserProfile = profileResult.value;
      } else {
        console.error("Fetch Profile Error (settled):", profileResult.reason);
        if (authUser) resolvedCurrentUserProfile = { id: authUser.id, email: authUser.email || '', name: 'Utilisateur', avatar: '', role: 'collaborator', created_at: new Date().toISOString() } as UserType;
      }
      setCurrentUserProfileState(resolvedCurrentUserProfile);

      if (projectResult.status === 'rejected' || !projectResult.value) {
        throw new Error(projectResult.status === 'rejected' ? (projectResult.reason as Error).message : "Projet non trouvé ou accès refusé.");
      }
      setProject(projectResult.value);

      if (ticketsResult.status === 'rejected') throw ticketsResult.reason;
      const currentTickets = ticketsResult.value || [];
      setTickets(currentTickets);

      if (membersResult.status === 'rejected') throw membersResult.reason;
      const fetchedMembers = membersResult.value || [];
      setProjectMembers(fetchedMembers);

      const newUserMap: Record<string, UserType> = {};
      if (resolvedCurrentUserProfile) newUserMap[resolvedCurrentUserProfile.id] = resolvedCurrentUserProfile;
      fetchedMembers.forEach(member => {
          if (member.users) newUserMap[member.users.id] = member.users;
      });
      const missingAssigneeIds = Array.from(new Set(
           currentTickets.map(t => t.assignee_id).filter((id): id is string => !!id && !newUserMap[id])
      ));
      if (missingAssigneeIds.length > 0) {
          try {
              const { data: missingUsers, error: missingUsersError } = await supabase
                  .from('users')
                  .select('*')
                  .in('id', missingAssigneeIds);
              if (missingUsersError) throw missingUsersError;
              (missingUsers || []).forEach(u => newUserMap[u.id] = u);
          } catch(assigneeError) {
              console.error("Error fetching missing ticket assignees:", assigneeError);
          }
      }
      setUserMap(newUserMap);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Impossible de charger les données du projet.'}`);
      setProject(null);
      setTickets([]);
      setProjectMembers([]);
      setUserMap({});
    } finally {
      setLoading(false);
    }
  }, [projectId, authUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- SECTION 2: LOGIQUE NON-HOOK (Handlers, Formatters) ---
  const formatDeadline = (dateString: string | null): string => {
     if (!dateString) return 'Pas de deadline';
     try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
     } catch (e) { return "Date invalide"; }
  };

  const handleTicketClick = (ticket: TicketType) => setSelectedTicket(ticket);

  const handleTicketUpdate = async (ticketId: string, updates: Partial<TicketType>) => {
    const originalTickets = [...tickets];
    const originalSelectedTicket = selectedTicket ? {...selectedTicket} : null;
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
    if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
    }
    setError(null);
    try {
        await updateTicket(ticketId, updates);
    } catch (err) {
        console.error('Error updating ticket:', err);
        setError(`Erreur mise à jour ticket: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setTickets(originalTickets);
        if (originalSelectedTicket?.id === ticketId) setSelectedTicket(originalSelectedTicket);
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    handleTicketUpdate(ticketId, { status: newStatus.toLowerCase() as TicketType['status'] });
  };

  const handleAssignToMe = (ticketId: string) => {
    const currentUserId = currentUserProfile?.id || authUser?.id;
    if (!currentUserId) {
        setError("Impossible de s'assigner : utilisateur non identifié.");
        return;
    }
    handleTicketUpdate(ticketId, { assignee_id: currentUserId });
  };

  const handleAddTicket = (status?: TicketStatus) => { // Status est optionnel
    setInitialTicketStatus(status || TicketStatus.BACKLOG); // Défaut à Backlog si non fourni
    setShowCreateTicketModal(true);
    setError(null);
  };


  // --- SECTION 3: RETOURS CONDITIONNELS (loading, error) ---
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

   if (error && !project) { // Si erreur ET project est null (erreur bloquante initiale)
     return (
         <div className="p-8 text-center">
              <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
                <AlertCircle size={32} />
                <span>{error}</span>
                 <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="mr-2">Retour aux projets</Button>
                 <Button variant="primary" size="sm" onClick={fetchData} iconLeft={<RefreshCw size={14}/>}>Réessayer</Button>
              </div>
         </div>
     );
   }
   // Si !project mais pas d'erreur explicite (ex: ID invalide géré au début de fetchData)
   if (!project) {
     return (
         <div className="p-8 text-center">
              <div className="p-4 inline-flex flex-col items-center bg-deep-space text-moon-gray border border-white/10 rounded-lg gap-3">
                <AlertTriangle size={32} />
                <span>Le projet demandé n'a pas pu être chargé ou n'existe pas.</span>
                 <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>Retour aux projets</Button>
              </div>
         </div>
     );
   }

  // --- SECTION 4: CALCULS FINALS ---
  const totalTasks = filteredTickets.length;
  const completedTasks = filteredTickets.filter(t => t.status === 'done').length;

  // --- SECTION 5: RENDU JSX PRINCIPAL ---
  return (
    <div className="p-8 flex flex-col h-[calc(100vh-4rem)]">
       {error && !loading && ( // Affichage pour les erreurs non bloquantes (ex: update ticket)
            <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm fixed top-20 right-8 z-50 shadow-lg">
              <AlertCircle size={18} />
              <span className='flex-1'>{error}</span>
               <button onClick={() => setError(null)} className="ml-auto text-red-alert/70 hover:text-red-alert flex-shrink-0"><IconX size={16}/></button>
            </div>
        )}

      {/* Project Header */}
      <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-orbitron text-star-white mb-1">{project.name}</h1>
            <p className="text-moon-gray text-sm">{project.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} iconLeft={<RefreshCw size={16} />} disabled={loading}>
              {loading ? 'Actualisation...' : 'Rafraîchir'}
          </Button>
      </div>


       {/* Project Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 flex-shrink-0">
         {/* Deadline Card */}
         <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
             <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-moon-gray" /><h3 className="text-base font-medium text-star-white">Deadline</h3></div>
             <p className="text-lg font-orbitron text-star-white">{formatDeadline(project.deadline)}</p>
         </div>
         {/* Progress Card */}
         <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
             <div className="flex items-center gap-2 mb-2"><Layers size={16} className="text-moon-gray" /><h3 className="text-base font-medium text-star-white">Progression</h3></div>
             <div className="flex justify-between items-center mb-1 text-sm"><span className="text-moon-gray">{completedTasks}/{totalTasks} tâches</span><span className="text-star-white">{completion}%</span></div>
             <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-nebula-purple transition-width duration-500" style={{ width: `${completion}%` }}></div></div>
         </div>
        {/* Team Card */}
        <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <Users size={16} className="text-moon-gray" />
                <h3 className="text-base font-medium text-star-white">Équipe ({projectMembers.length})</h3>
             </div>
             {isOwner && (
               <Button variant="ghost" size="sm" iconLeft={<UserCog size={14} />} onClick={() => setShowMembersModal(true)} className="text-moon-gray hover:text-nebula-purple" title="Gérer les membres">Gérer</Button>
             )}
           </div>
           <div className="flex -space-x-2 overflow-hidden items-center">
             {projectMembers.slice(0, 5).map(member => {
               if (member.users) {
                 return ( <Avatar key={member.user_id} src={member.users.avatar || ''} alt={member.users.name || 'Membre inconnu'} size="md" className="border-2 border-deep-space" title={`${member.users.name || 'Membre'} (${member.role})`} />);
               }
               return null;
             })}
             {projectMembers.length > 5 && (<div key="plus-members-indicator" className="w-10 h-10 rounded-full bg-white/10 text-star-white flex items-center justify-center text-xs border-2 border-deep-space z-10" title={`${projectMembers.length - 5} autres membres`}>+{projectMembers.length - 5}</div>)}
             {projectMembers.length === 0 && (<p key="no-members-message" className="text-xs text-moon-gray">Aucun membre.</p>)}
           </div>
         </div>
      </div>

      {/* Kanban Board Actions */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-orbitron text-star-white">Tableau Kanban</h2>
          {urgentCount > 0 && ( <div className="flex items-center gap-1 bg-red-alert/20 text-red-alert px-2 py-0.5 rounded-full"><AlertTriangle size={14} /><span className="text-xs font-medium">{urgentCount} urgent{urgentCount > 1 ? 's' : ''}</span></div>)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" iconLeft={<ListFilter size={16} />} onClick={() => setFilterMine(!filterMine)} className={filterMine ? 'bg-nebula-purple/20 text-nebula-purple' : ''} title="Filtrer mes tâches">Mes tâches</Button>
          <Button variant="ghost" size="sm" iconLeft={<AlertTriangle size={16} />} onClick={() => setFilterUrgent(!filterUrgent)} className={filterUrgent ? 'bg-red-alert/20 text-red-alert' : ''} title="Filtrer les tâches urgentes">Urgent</Button>
          <Button variant="primary" size="sm" iconLeft={<Plus size={16} />} onClick={() => handleAddTicket()} title="Ajouter un nouveau ticket">Ajouter Ticket</Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {Object.values(TicketStatus).map(statusKey => (
            <div key={statusKey} className="flex flex-col h-full w-[300px] flex-shrink-0">
              <KanbanColumn
                status={statusKey}
                title={TicketStatusLabels[statusKey]}
                tickets={ticketsByStatus[statusKey] || []}
                onTicketClick={handleTicketClick}
                onAddTicket={handleAddTicket} // Passé à KanbanColumn
                userMap={userMap}
                currentUserId={currentUserProfile?.id || authUser?.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && project && ( // Assure que project est défini
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          userMap={userMap}
          projectData={project}
        />
      )}

      {/* Member Management Modal */}
       {showMembersModal && project && projectId && (currentUserProfile || authUser) && (
         <ProjectMembersModal
           isOpen={showMembersModal}
           onClose={() => setShowMembersModal(false)}
           projectId={projectId}
           ownerId={project.owner_id}
           currentUserId={currentUserProfile?.id || authUser?.id || ''}
           initialMembers={projectMembers}
           onMembersUpdate={fetchData}
         />
       )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && project && projectId && (
        <CreateTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => setShowCreateTicketModal(false)}
          projectId={projectId}
          projectName={project.name}
          initialStatus={initialTicketStatus}
          projectMembers={
            projectMembers
              .map(pm => pm.users)
              .filter((user): user is UserType => user !== null && user !== undefined) // Filter out null/undefined users
          }
          onTicketCreated={(newTicket) => {
            setTickets(prevTickets => [newTicket, ...prevTickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Ajoute et trie
            // Optionnel: afficher un toast/message de succès
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;