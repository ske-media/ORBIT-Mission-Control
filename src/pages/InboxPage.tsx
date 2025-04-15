import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, MessageSquare, Trash2, X, AlertCircle } from 'lucide-react'; // Added Trash2, AlertCircle
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  getCurrentUserProfile,
  getInboxItems,
  createInboxItem,
  getUserById,
  getProjectById,
  supabase // Import supabase directly for delete
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext'; // Needed if getCurrentUserProfile fails

type InboxItem = Database['public']['Tables']['inbox_items']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

const InboxPage: React.FC = () => {
  const [newMessage, setNewMessage] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false); // Loading state for creation
  const [error, setError] = useState<string | null>(null);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({}); // Renamed for clarity
  const [usersMap, setUsersMap] = useState<Record<string, User>>({}); // Renamed for clarity

  const { user: authUser } = useAuth(); // Get basic auth user as fallback

  // Function to fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current user profile first
      const userProfile = await getCurrentUserProfile();
      if (!userProfile && authUser) {
        // Fallback or specific handling if profile is missing but auth exists
        console.warn("Current user profile not found in 'users' table, using auth data where possible.");
        // Use authUser for basic info if needed, but some features might be limited
        setCurrentUser({ // Construct a partial User object from auth if necessary
            id: authUser.id,
            email: authUser.email || 'N/A',
            name: authUser.user_metadata?.name || 'Utilisateur', // Example fallback
            avatar: authUser.user_metadata?.avatar_url || 'DEFAULT_AVATAR_URL', // Example fallback
            role: 'collaborator', // Assuming default role if profile missing
            created_at: authUser.created_at || new Date().toISOString(),
        });
      } else {
          setCurrentUser(userProfile);
      }


      // Fetch inbox items (RLS should apply if configured)
      const items = await getInboxItems();
      setInboxItems(items || []);

      // Batch fetch related data efficiently
      const userIds = new Set<string>();
      const projectIds = new Set<string>();
      (items || []).forEach(item => {
        if (item.created_by) userIds.add(item.created_by);
        if (item.project_id) projectIds.add(item.project_id);
      });

      // Add current user ID just in case it's needed but not in items
      if (userProfile?.id) userIds.add(userProfile.id);
      else if (authUser?.id) userIds.add(authUser.id);


      // Fetch users involved
      let userLookup: Record<string, User> = {};
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds));
        if (usersError) throw usersError;
        (usersData || []).forEach(u => userLookup[u.id] = u);
      }
      setUsersMap(userLookup);

      // Fetch projects involved
      let projectLookup: Record<string, Project> = {};
      if (projectIds.size > 0) {
         const { data: projectsData, error: projectsError } = await supabase
           .from('projects')
           .select('*')
           .in('id', Array.from(projectIds));
         if (projectsError) throw projectsError;
        (projectsData || []).forEach(p => projectLookup[p.id] = p);
      }
      setProjectsMap(projectLookup);

    } catch (err: any) {
      console.error('Error fetching inbox data:', err);
      setError(`Failed to load inbox data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []); // Fetch on mount

  const formatDate = (dateString: string | null): string => {
     if (!dateString) return '';
    const date = new Date(dateString);
    // ... (keep existing formatting logic) ...
     const now = new Date();
     const isToday = date.toDateString() === now.toDateString();
     if (isToday) {
       return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
     }
     return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) { // Check for current user ID
        setError("Cannot create item: user not identified.");
        return;
    }
    setCreating(true);
    setError(null);

    try {
      // Use createInboxItem helper which includes created_by automatically now
      const newItemData = await createInboxItem({
        content: newMessage,
        // project_id: null, // Set this if you add project linking to the form
      });

      if (newItemData) {
        // Add the new item optimistically, refetch users/projects if needed
        setInboxItems(prevItems => [newItemData, ...prevItems]);
        setNewMessage('');

        // Ensure the creator's data is available if not already fetched
        if (!usersMap[newItemData.created_by] && currentUser) {
            setUsersMap(prev => ({ ...prev, [currentUser.id]: currentUser }));
        }
      } else {
          throw new Error("Failed to create item in database.");
      }
    } catch (err: any) {
      console.error('Error creating inbox item:', err);
      setError(`Failed to save item: ${err.message || 'Unknown error'}`);
    } finally {
        setCreating(false);
    }
  };

  // --- Basic Delete Functionality ---
  const handleDelete = async (itemId: string) => {
     // TODO: Add a confirmation dialog for production
     // if (!window.confirm("Supprimer cet élément définitivement ?")) return;

    setError(null);
    try {
        const { error: deleteError } = await supabase
            .from('inbox_items')
            .delete()
            .eq('id', itemId);

        if (deleteError) throw deleteError;

        // Remove item from local state
        setInboxItems(prevItems => prevItems.filter(item => item.id !== itemId));

    } catch (err: any) {
        console.error('Error deleting inbox item:', err);
        setError(`Failed to delete item: ${err.message || 'Unknown error'}`);
    }
  };

  // --- Placeholder Actions ---
  const handleComment = (itemId: string) => {
      console.log("TODO: Implement commenting for item:", itemId);
      alert("Fonctionnalité de commentaire non implémentée.");
  };

  const handleCreateTask = (item: InboxItem) => {
      console.log("TODO: Implement create task from inbox item:", item);
      alert("Fonctionnalité 'Créer une tâche' non implémentée.");
      // Needs a modal/form to collect task details (project, assignee, priority, etc.)
      // Then call `createTicket` helper
  };


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Inbox</h1>
        <p className="text-moon-gray">Idées, demandes, et notes à trier plus tard.</p>
      </div>

      {/* Creation Form */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="bg-deep-space rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3 mb-3">
            <Avatar
              src={currentUser?.avatar || 'DEFAULT_AVATAR_URL'} // Use default if no user/avatar
              alt={currentUser?.name || 'Utilisateur'}
              size="md"
            />
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={currentUser ? "Notez une idée, demande ou question..." : "Connectez-vous pour ajouter des notes"}
                className="w-full bg-space-black min-h-[80px] rounded-lg p-3 text-star-white placeholder:text-moon-gray focus:outline-none focus:ring-1 focus:ring-nebula-purple border border-white/10"
                disabled={!currentUser || creating}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              iconRight={<Send size={16} />}
              disabled={!newMessage.trim() || !currentUser || creating}
            >
              {creating ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </div>

      {/* Inbox Items List */}
      <div className="space-y-4">
        {inboxItems.length === 0 && !loading && (
             <p className="text-moon-gray col-span-full text-center py-8">Votre inbox est vide.</p>
        )}
        {inboxItems.map((item, index) => {
          const creator = usersMap[item.created_by];
          const project = item.project_id ? projectsMap[item.project_id] : null;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="bg-deep-space rounded-xl p-4 border border-white/10 group relative" // Added relative for absolute positioning of delete
            >
              <div className="flex items-start gap-3">
                 <Avatar
                   src={creator?.avatar || 'DEFAULT_AVATAR_URL'}
                   alt={creator?.name || 'Utilisateur inconnu'}
                   size="md"
                 />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-star-white">
                      {creator?.name || 'Utilisateur inconnu'}
                    </h3>
                    <span className="text-xs text-moon-gray">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-star-white mb-3 whitespace-pre-wrap">{item.content}</p> {/* Use pre-wrap for line breaks */}

                  {project && (
                    <div className="flex items-center mt-2">
                      <span className="bg-nebula-purple/20 text-nebula-purple text-xs px-2 py-1 rounded-full">
                        Projet: {project.name || 'Projet inconnu'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

               {/* Actions */}
               <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                 <div> {/* Group left buttons */}
                   <Button
                     variant="ghost"
                     size="sm"
                     iconLeft={<MessageSquare size={14} />}
                     onClick={() => handleComment(item.id)}
                     className="text-moon-gray hover:text-star-white"
                     title="Commenter (non implémenté)"
                   >
                     Commenter
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     iconLeft={<Plus size={14} />}
                     onClick={() => handleCreateTask(item)}
                     className="text-moon-gray hover:text-star-white ml-2"
                     title="Créer une tâche (non implémenté)"
                   >
                     Créer une tâche
                   </Button>
                 </div>

                 {/* Delete Button - positioned absolutely on hover */}
                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-alert/70 hover:text-red-alert hover:bg-red-alert/10 p-1" // Danger styling
                        title="Supprimer l'élément"
                    >
                        <Trash2 size={16} />
                    </Button>
                 </div>
               </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InboxPage;