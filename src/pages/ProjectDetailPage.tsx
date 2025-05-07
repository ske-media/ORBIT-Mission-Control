// src/pages/ProjectDetailPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { /* ... tes imports lucide ... */ Calendar, ListFilter, Users, Layers, AlertTriangle, Plus, AlertCircle, UserCog, RefreshCw, X as IconX } from 'lucide-react';
import { TicketStatus, TicketStatusLabels } from '../types';
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import ProjectMembersModal from '../components/projects/ProjectMembersModal';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  getProjectById,
  getTicketsByProject,
  getProjectMembers,
  getCurrentUserProfile,
  updateTicket,
  createNotification, // <<--- AJOUTER createNotification
  supabase,
  ProjectMemberWithUser
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';

// ... (Types ProjectType, UserType, TicketType - inchangés) ...

const ProjectDetailPage: React.FC = () => {
  // ... (Tous les états useState, useMemo, fetchData, useEffect - globalement inchangés, SAUF handleTicketUpdate) ...
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
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [initialTicketStatus, setInitialTicketStatus] = useState<TicketStatus | undefined>(undefined);

  const filteredTickets = useMemo(() => { /* ... */ }, [tickets, filterMine, filterUrgent, currentUserProfile, authUser]);
  const ticketsByStatus = useMemo(() => { /* ... */ }, [filteredTickets]);
  const isOwner = useMemo(() => { /* ... */ }, [project, currentUserProfile, authUser]);
  const completion = useMemo(() => { /* ... */ }, [filteredTickets]);
  const urgentCount = useMemo(() => { /* ... */ }, [filteredTickets]);
  const fetchData = useCallback(async () => { /* ... (comme avant) ... */ }, [projectId, authUser]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const formatDeadline = (dateString: string | null): string => { /* ... */ };
  const handleTicketClick = (ticket: TicketType) => setSelectedTicket(ticket);


  const handleTicketUpdate = async (ticketId: string, updates: Partial<TicketType>): Promise<TicketType | null> => {
    const originalTickets = [...tickets];
    const ticketAvantUpdate = tickets.find(t => t.id === ticketId);
    const originalSelectedTicket = selectedTicket ? {...selectedTicket} : null;

    // Mise à jour optimiste
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } as TicketType : t));
    if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, ...updates } as TicketType : null);
    }
    setError(null);

    try {
        const ticketApresUpdate = await updateTicket(ticketId, updates); // updateTicket retourne le ticket mis à jour
        if (!ticketApresUpdate) throw new Error("La mise à jour du ticket a échoué ou n'a retourné aucune donnée.");

        // --- NOTIFICATION : CHANGEMENT D'ASSIGNÉ (si c'est le cas) ---
        if (ticketAvantUpdate && ticketApresUpdate.assignee_id &&
            ticketApresUpdate.assignee_id !== ticketAvantUpdate.assignee_id && // L'assigné a changé
            ticketApresUpdate.assignee_id !== authUser?.id) { // Et ce n'est pas une auto-assignation par l'assigné lui-même

            const assignerName = currentUserProfile?.name || authUser?.user_metadata?.name || "Quelqu'un";
            const projectNameForNotif = project?.name || "un projet";

            try {
                await createNotification({
                    user_id: ticketApresUpdate.assignee_id, // Nouvel assigné
                    content: `${assignerName} vous a assigné la tâche "${ticketApresUpdate.title}" dans le projet "${projectNameForNotif}".`,
                    type: 'ticket_assigned',
                    related_entity: 'ticket',
                    related_id: ticketApresUpdate.id,
                });
            } catch (notifError) {
                console.error("Erreur création notif (changement assigné via update):", notifError);
            }
        }
        // --- FIN NOTIFICATION ---

        // Mise à jour de l'état local avec le ticket retourné par updateTicket (plus fiable)
        setTickets(prev => prev.map(t => t.id === ticketId ? ticketApresUpdate : t));
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket(ticketApresUpdate);
        }
        return ticketApresUpdate;
    } catch (err) {
        console.error('Error updating ticket:', err);
        setError(`Erreur mise à jour ticket: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setTickets(originalTickets);
        if (originalSelectedTicket?.id === ticketId) setSelectedTicket(originalSelectedTicket);
        return null;
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => { // Rendre async pour await
    await handleTicketUpdate(ticketId, { status: newStatus.toLowerCase() as TicketType['status'] });
  };

  const handleAssignToMe = async (ticketId: string): Promise<TicketType | null | void> => {
    const currentUserId = currentUserProfile?.id || authUser?.id;
    if (!currentUserId) {
        setError("Impossible de s'assigner : utilisateur non identifié.");
        return null;
    }
    // La notification sera gérée par handleTicketUpdate si l'assigné change réellement
    return handleTicketUpdate(ticketId, { assignee_id: currentUserId });
  };

  const handleAddTicket = (status?: TicketStatus) => { /* ... (comme avant) ... */ };

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
    projectName={project.name} // <<--- C'EST CETTE LIGNE !
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