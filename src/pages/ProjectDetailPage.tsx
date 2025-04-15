import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Calendar, ListFilter, Users, Layers, AlertTriangle, Plus, AlertCircle } from 'lucide-react'; // Added Plus, AlertCircle
import { TicketStatus, TicketStatusLabels } from '../types'; // Removed Ticket type import if not used directly
import KanbanColumn from '../components/tickets/KanbanColumn';
import TicketModal from '../components/tickets/TicketModal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  getProjectById,
  getTicketsByProject,
  getUserById,
  getCurrentUserProfile,
  updateTicket,
  supabase // Direct import for potential complex queries/updates later
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

type ProjectType = Database['public']['Tables']['projects']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type TicketType = Database['public']['Tables']['tickets']['Row'];

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate(); // Hook for navigation
  const { user: authUser } = useAuth(); // Get authenticated user

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]); // Renamed for clarity
  const [currentUserProfile, setCurrentUserProfileState] = useState<UserType | null>(null); // Keep track of fetched profile
  const [filterMine, setFilterMine] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, UserType>>({}); // Map for assignee lookups

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setError("ID de projet manquant.");
      setLoading(false);
      return;
    }
    // Check basic UUID format before fetching
     if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(projectId)) {
        setError("Format d'ID de projet invalide.");
        setLoading(false);
        setProject(null); // Ensure project is null if ID is invalid
        return;
    }


    setLoading(true);
    setError(null);

    try {
      // Fetch current user profile (needed for filtering 'Mine')
      // Do this early but don't block if it fails; rely on authUser.id
      const userProfile = await getCurrentUserProfile();
      setCurrentUserProfileState(userProfile);

      // Fetch project details (RLS should protect this)
      const projectData = await getProjectById(projectId);
      if (!projectData) {
          // If RLS prevented fetch or project doesn't exist
          throw new Error("Projet non trouvé ou accès refusé.");
      }
      setProject(projectData);

      // Fetch tickets for this project (RLS should protect this)
      const ticketsData = await getTicketsByProject(projectId);
      setTickets(ticketsData || []);

      // --- Efficiently fetch unique users involved (assignees + potentially project owner/members) ---
      const userIds = new Set<string>();

      // Add current user ID
      if (userProfile?.id) userIds.add(userProfile.id);
      else if (authUser?.id) userIds.add(authUser.id);

      // Add project owner ID
      if (projectData?.owner_id) userIds.add(projectData.owner_id);

       // Add assignees from tickets
      (ticketsData || []).forEach(ticket => {
        if (ticket.assignee_id) userIds.add(ticket.assignee_id);
      });

      // TODO: Fetch project members from `project_members` table if needed for a more complete team view
      // const { data: membersData } = await supabase.from('project_members').select('user_id').eq('project_id', projectId);
      // membersData?.forEach(m => userIds.add(m.user_id));

      const usersToFetch = Array.from(userIds);
      const fetchedUsersData: UserType[] = [];
      const fetchedUserMap: Record<string, UserType> = {};

      if (usersToFetch.length > 0) {
          const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('*')
              .in('id', usersToFetch);

          if (usersError) throw usersError;

          (usersData || []).forEach(u => {
              fetchedUsersData.push(u);
              fetchedUserMap[u.id] = u;
          });
      }

      setTeamMembers(fetchedUsersData); // Set team based on fetched users
      setUserMap(fetchedUserMap); // Set map for ticket assignees

    } catch (err: any) {
      console.error('Error fetching project data:', err);
      setError(`Erreur: ${err.message || 'Impossible de charger les données du projet.'}`);
      setProject(null); // Clear project data on error
      setTickets([]);
      setTeamMembers([]);
      setUserMap({});
    } finally {
      setLoading(false);
    }
  }, [projectId, authUser]); // Depend on projectId and authUser

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Fetch data on mount and when projectId changes

  const formatDeadline = (dateString: string | null): string => {
     if (!dateString) return 'Pas de deadline';
     try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
     } catch (e) {
        console.error("Invalid date format for deadline:", dateString);
        return "Date invalide";
     }
  };

  // Memoize filtered tickets for performance
  const filteredTickets = useMemo(() => {
    const currentUserId = currentUserProfile?.id || authUser?.id; // Prioritize profile ID
    return tickets.filter(ticket => {
      // Apply 'Mine' filter only if currentUserId is available
      if (filterMine && currentUserId && ticket.assignee_id !== currentUserId) return false;
      if (filterUrgent && ticket.priority !== 'high') return false;
      return true;
    });
  }, [tickets, filterMine, filterUrgent, currentUserProfile, authUser]);

  // Memoize tickets grouped by status
  const ticketsByStatus = useMemo(() => {
    return Object.values(TicketStatus).reduce((acc, status) => {
      acc[status] = filteredTickets.filter(ticket => ticket.status === status.toLowerCase());
      return acc;
    }, {} as Record<TicketStatus, TicketType[]>);
  }, [filteredTickets]);


  const handleTicketClick = (ticket: TicketType) => {
    setSelectedTicket(ticket);
  };

  // --- Ticket Update Handlers ---
  const handleTicketUpdate = async (ticketId: string, updates: Partial<TicketType>) => {
    setError(null); // Clear previous errors
    try {
        const updatedTicket = await updateTicket(ticketId, updates);
        if (!updatedTicket) {
            throw new Error("La mise à jour du ticket a échoué côté serveur.");
        }

        // Update local state
        setTickets(prev => prev.map(ticket =>
            ticket.id === ticketId ? updatedTicket : ticket
        ));

        // Update selected ticket if it's open
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket(updatedTicket);
        }
         return updatedTicket; // Return updated ticket on success
    } catch (err: any) {
        console.error('Error updating ticket:', err);
        setError(`Erreur mise à jour ticket: ${err.message}`);
        return null; // Indicate failure
    }
  };


  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
     handleTicketUpdate(ticketId, { status: newStatus.toLowerCase() });
  };

  const handleAssignToMe = (ticketId: string) => {
    const currentUserId = currentUserProfile?.id || authUser?.id;
    if (!currentUserId) {
        setError("Impossible de s'assigner : utilisateur non identifié.");
        return;
    }
    handleTicketUpdate(ticketId, { assignee_id: currentUserId });
  };

  // --- TODO: Implement Add Ticket ---
  const handleAddTicket = (status: TicketStatus) => {
    console.log(`TODO: Open 'Add Ticket' modal with status: ${status}`);
    alert(`Fonctionnalité "Ajouter un Ticket" (status: ${status}) non implémentée.`);
    // 1. Need a modal component for creating tickets.
    // 2. Modal should collect title, description, priority, deadline, assignee.
    // 3. On submit, call `createTicket` helper from `src/lib/supabase.ts`.
    // 4. If successful, close modal and call `fetchData()` or optimistically add to `tickets` state.
  };

  // --- Calculate project stats using memoized filtered tickets ---
  const completion = useMemo(() => {
    if (!filteredTickets.length) return 0;
    const completed = filteredTickets.filter(t => t.status === 'done').length;
    return Math.round((completed / filteredTickets.length) * 100);
  }, [filteredTickets]);

  const urgentCount = useMemo(() => {
    return filteredTickets.filter(t => t.priority === 'high' && t.status !== 'done').length;
  }, [filteredTickets]);

  const totalTasks = filteredTickets.length;
  const completedTasks = filteredTickets.filter(t => t.status === 'done').length;

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

   // Handle error or project not found after loading
   if (error || !project) {
     return (
         <div className="p-8 text-center">
              <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
                <AlertCircle size={32} />
                <span>{error || "Projet non trouvé ou inaccessible."}</span>
                 <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                   Retour aux projets
                 </Button>
              </div>
         </div>
     );
   }

  // --- Main Render ---
  return (
    <div className="p-8 flex flex-col h-[calc(100vh-4rem)]"> {/* Adjust height based on header/layout */}
      {/* Project Header */}
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">{project.name}</h1>
        <p className="text-moon-gray">{project.description}</p>
      </div>

       {/* Project Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 flex-shrink-0">
         {/* Deadline */}
         <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
           <div className="flex items-center gap-2 mb-2">
             <Calendar size={16} className="text-moon-gray" />
             <h3 className="text-base font-medium text-star-white">Deadline</h3>
           </div>
           <p className="text-lg font-orbitron text-star-white">{formatDeadline(project.deadline)}</p>
         </div>
         {/* Progress */}
         <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
           <div className="flex items-center gap-2 mb-2">
             <Layers size={16} className="text-moon-gray" />
             <h3 className="text-base font-medium text-star-white">Progression</h3>
           </div>
           <div className="flex justify-between items-center mb-1 text-sm">
             <span className="text-moon-gray">{completedTasks}/{totalTasks} tâches</span>
             <span className="text-star-white">{completion}%</span>
           </div>
           <div className="h-2 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-nebula-purple transition-width duration-500" style={{ width: `${completion}%` }}></div>
           </div>
         </div>
         {/* Team */}
         <div className="bg-deep-space rounded-xl p-4 md:p-6 border border-white/10">
           <div className="flex items-center gap-2 mb-2">
             <Users size={16} className="text-moon-gray" />
             <h3 className="text-base font-medium text-star-white">Équipe</h3>
           </div>
           <div className="flex -space-x-2 overflow-hidden items-center">
             {teamMembers.slice(0, 5).map(member => ( // Limit displayed avatars
               <Avatar
                 key={member.id}
                 src={member.avatar}
                 alt={member.name}
                 size="md"
                 className="border-2 border-deep-space" // Ensure overlap looks good
                 title={member.name} // Add tooltip
               />
             ))}
             {teamMembers.length > 5 && (
                 <div className="w-10 h-10 rounded-full bg-white/10 text-star-white flex items-center justify-center text-xs border-2 border-deep-space z-10">
                   +{teamMembers.length - 5}
                 </div>
             )}
              {teamMembers.length === 0 && (
                  <p className="text-xs text-moon-gray">Aucun membre assigné.</p>
              )}
             {/* TODO: Add button to manage team members */}
             {/* <button className="ml-2 w-8 h-8 rounded-full bg-white/10 text-star-white flex items-center justify-center text-xs hover:bg-white/20">+</button> */}
           </div>
         </div>
      </div>

      {/* Kanban Board Actions */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-orbitron text-star-white">Tableau Kanban</h2>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1 bg-red-alert/20 text-red-alert px-2 py-0.5 rounded-full">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">{urgentCount} urgent{urgentCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<ListFilter size={16} />}
            onClick={() => setFilterMine(!filterMine)}
            className={filterMine ? 'bg-nebula-purple/20 text-nebula-purple' : ''}
            title="Filtrer mes tâches"
          >
            Mes tâches
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<AlertTriangle size={16} />}
            onClick={() => setFilterUrgent(!filterUrgent)}
            className={filterUrgent ? 'bg-red-alert/20 text-red-alert' : ''}
            title="Filtrer les tâches urgentes"
          >
            Urgent
          </Button>
          {/* TODO: Add button to create new ticket */}
           <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus size={16} />}
                onClick={() => handleAddTicket(TicketStatus.BACKLOG)} // Example: default to Backlog
                title="Ajouter un nouveau ticket (non implémenté)"
            >
                Ajouter Ticket
            </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4"> {/* Added flex-1 and overflow */}
        <div className="flex gap-6 min-w-max h-full"> {/* Added h-full */}
          {Object.values(TicketStatus).map(status => (
            <div key={status} className="flex flex-col h-full w-[300px] flex-shrink-0"> {/* Set width and flex-col */}
              <KanbanColumn
                status={status}
                title={TicketStatusLabels[status]}
                tickets={ticketsByStatus[status] || []}
                onTicketClick={handleTicketClick}
                onAddTicket={handleAddTicket} // Pass handler
                userMap={userMap} // Pass userMap
                currentUserId={currentUserProfile?.id || authUser?.id} // Pass current user ID
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange} // Pass handlers
          onAssignToMe={handleAssignToMe}
          userMap={userMap} // Pass needed data
          projectData={project}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;