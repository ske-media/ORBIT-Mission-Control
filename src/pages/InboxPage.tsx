// src/pages/InboxPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, MessageSquare, Trash2, X as IconX, AlertCircle, RefreshCw, Edit3, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import TicketFormModal from '../components/tickets/TicketFormModal';
import {
  getCurrentUserProfile,
  getInboxItems,
  createInboxItem,
  getProjects, // Pour lister les projets dans la modal de création de ticket
  supabase,
  ProjectMemberWithUser // Pour type si jamais on voulait afficher plus tard des membres
} from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TicketStatus } from '../types'; // Pour le statut par défaut

// Types
type InboxItemType = Database['public']['Tables']['inbox_items']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
type ProjectTypeForSelect = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>; // Pour le sélecteur de projet
type TicketType = Database['public']['Tables']['tickets']['Row'];

const InboxPage: React.FC = () => {
  // --- États Principaux ---
  const [newMessage, setNewMessage] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItemType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  // Map pour les détails des projets liés aux items (pour affichage)
  const [projectsLinkedMap, setProjectsLinkedMap] = useState<Record<string, ProjectTypeForSelect>>({});
  // Map pour les détails des créateurs des items (pour affichage)
  const [usersMap, setUsersMap] = useState<Record<string, UserType>>({});
  // Liste des projets disponibles pour la création de ticket
  const [availableProjectsForModal, setAvailableProjectsForModal] = useState<ProjectTypeForSelect[]>([]);

  // --- États UI et Opérations ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingItem, setCreatingItem] = useState(false); // Pour la création d'item inbox
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // États pour la modal de création de ticket
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedInboxItemForTicket, setSelectedInboxItemForTicket] = useState<InboxItemType | null>(null);

  const { user: authUser } = useAuth();

  // --- Fetch Initial Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResult, itemsResult, allProjectsResult] = await Promise.allSettled([
        getCurrentUserProfile(),
        getInboxItems(),
        getProjects() // Récupère tous les projets accessibles (pour le sélecteur de CreateTicketModal)
      ]);

      // Profil
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setCurrentUser(profileResult.value);
      } else {
        console.warn("InboxPage: Failed to fetch/find current user profile.", profileResult.status === 'rejected' ? profileResult.reason : '');
        if (authUser) setCurrentUser({ id: authUser.id, email: authUser.email || '', name: authUser.user_metadata?.name || 'Utilisateur', avatar: authUser.user_metadata?.avatar_url || '', role: 'collaborator', created_at: new Date().toISOString() });
      }

      // Items Inbox
      if (itemsResult.status === 'rejected') throw itemsResult.reason;
      const items = itemsResult.value || [];
      setInboxItems(items);

      // Projets pour la modal de création de ticket
      if (allProjectsResult.status === 'rejected') {
        console.error("Error fetching all projects for modal selector:", allProjectsResult.reason);
        setAvailableProjectsForModal([]);
      } else {
        setAvailableProjectsForModal(
          (allProjectsResult.value || []).map(p => ({ id: p.id, name: p.name }))
        );
      }

      // Construction des maps pour affichage des détails
      const userIdsToFetch = new Set<string>();
      const projectIdsFromItems = new Set<string>();
      items.forEach(item => {
        if (item.created_by) userIdsToFetch.add(item.created_by);
        if (item.project_id) projectIdsFromItems.add(item.project_id);
      });
      const currentUserId = (profileResult.status === 'fulfilled' && profileResult.value?.id) || authUser?.id;
      if (currentUserId) userIdsToFetch.add(currentUserId);

      let userLookup: Record<string, UserType> = {};
      let projectLookup: Record<string, ProjectTypeForSelect> = {};

      const mapPromises = [];
      if (userIdsToFetch.size > 0) mapPromises.push(supabase.from('users').select('id, name, avatar, email').in('id', Array.from(userIdsToFetch)));
      else mapPromises.push(Promise.resolve({ data: [], error: null }));

      if (projectIdsFromItems.size > 0) mapPromises.push(supabase.from('projects').select('id, name').in('id', Array.from(projectIdsFromItems)));
      else mapPromises.push(Promise.resolve({ data: [], error: null }));

      const [usersResponse, projectsLinkedResponse] = await Promise.all(mapPromises);

      if (usersResponse.error) throw usersResponse.error;
      if (projectsLinkedResponse.error) throw projectsLinkedResponse.error;

      (usersResponse.data || []).forEach((u: any) => userLookup[u.id] = u as UserType); // Cast temporaire
      (projectsLinkedResponse.data || []).forEach((p: any) => projectLookup[p.id] = p as ProjectTypeForSelect);

      setUsersMap(userLookup);
      setProjectsLinkedMap(projectLookup);

    } catch (err) {
      console.error('Error fetching inbox data:', err);
      setError(`Échec du chargement des données de l'inbox: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Handlers ---
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
  };

  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentAuthUserId = currentUser?.id || authUser?.id;
    if (!newMessage.trim() || !currentAuthUserId) {
      setError("Message vide ou utilisateur non identifié.");
      return;
    }
    setCreatingItem(true);
    setError(null);
    try {
      const newItemData = await createInboxItem({ content: newMessage /* , project_id: (si on ajoute un sélecteur ici) */ });
      setInboxItems(prevItems => [newItemData, ...prevItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setNewMessage('');
      if (!usersMap[newItemData.created_by] && currentUser) { // Assure que le créateur est dans la map
          setUsersMap(prev => ({ ...prev, [currentAuthUserId]: currentUser }));
      }
    } catch (err) {
      console.error('Error creating inbox item:', err);
      setError(`Échec de la création de la note: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setCreatingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (deletingItemId) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;

    setDeletingItemId(itemId);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('inbox_items').delete().eq('id', itemId);
      if (deleteError) throw deleteError;
      setInboxItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting inbox item:', err);
      setError(`Échec de la suppression: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleCommentOnItem = (itemId: string) => {
    alert("Fonctionnalité de commentaire sur les notes non implémentée.");
  };

  const handleOpenCreateTaskModal = (item: InboxItemType) => {
    setSelectedInboxItemForTicket(item);
    setShowCreateTicketModal(true);
    setError(null); // Reset l'erreur principale de la page
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Affichage Erreur Globale (Fetch, Create, Delete) */}
      {error && (
        <div className="mb-6 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-alert/70 hover:text-red-alert flex-shrink-0"><IconX size={16}/></button>
        </div>
      )}

      {/* Header Page */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Inbox</h1>
          <p className="text-moon-gray">Idées, demandes et notes à trier.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} iconLeft={<RefreshCw size={16}/>} disabled={loading || creatingItem || !!deletingItemId}>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>

      {/* Formulaire de Création d'Item Inbox */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <form onSubmit={handleNewItemSubmit} className="mb-10 bg-deep-space rounded-xl p-4 border border-white/10 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <Avatar
              src={currentUser?.avatar || authUser?.user_metadata?.avatar_url || ''}
              alt={currentUser?.name || authUser?.user_metadata?.name || 'Utilisateur'}
              size="md"
            />
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={(currentUser || authUser) ? "Écrivez une note rapide, une idée, une tâche à faire..." : "Connectez-vous pour ajouter des notes"}
                className={`w-full bg-space-black min-h-[70px] rounded-lg p-3 text-star-white placeholder:text-moon-gray focus:outline-none focus:ring-1 border transition-all ${!(currentUser || authUser) || creatingItem ? 'border-white/5 bg-white/5 cursor-not-allowed opacity-70' : 'border-white/10 focus:ring-nebula-purple focus:border-nebula-purple hover:border-white/20'}`}
                disabled={!(currentUser || authUser) || creatingItem}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              iconRight={creatingItem ? null : <Send size={16} />}
              disabled={!newMessage.trim() || !(currentUser || authUser) || creatingItem}
            >
              {creatingItem ? 'Envoi...' : "Ajouter à l'Inbox"}            </Button>
          </div>
        </form>
      </motion.div>

      {/* Liste des Items Inbox */}
      {inboxItems.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <MessageSquare size={48} className="mx-auto text-moon-gray/50 mb-4" />
            <h3 className="text-lg font-medium text-star-white mb-1">Votre inbox est vide</h3>
            <p className="text-sm text-moon-gray">Utilisez le formulaire ci-dessus pour capturer vos idées.</p>
        </motion.div>
      )}

      <div className="space-y-4">
        {inboxItems.map((item, index) => {
          const creator = usersMap[item.created_by];
          const project = item.project_id ? projectsLinkedMap[item.project_id] : null;
          const isDeletingThisItem = deletingItemId === item.id;

          return (
            <motion.div
              key={item.id}
              layout // Pour animation si item supprimé
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className={`bg-deep-space rounded-xl p-4 border group relative transition-all duration-300 hover:shadow-nebula-purple/20 ${isDeletingThisItem ? 'opacity-40 scale-95 border-red-alert/30' : 'border-white/10 hover:border-white/20'}`}
            >
              <div className="flex items-start gap-3">
                 <Avatar src={creator?.avatar || ''} alt={creator?.name || 'Inconnu'} size="md" />
                <div className="flex-1 min-w-0"> {/* min-w-0 pour que truncate fonctionne */}
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-star-white truncate" title={creator?.name}>{creator?.name || 'Utilisateur inconnu'}</h3>
                    <span className="text-xs text-moon-gray flex-shrink-0 ml-2" title={new Date(item.created_at).toLocaleString('fr-FR')}>{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-star-white/90 mb-3 whitespace-pre-wrap text-sm break-words">{item.content}</p>
                  {project && (
                    <div className="flex items-center mt-2">
                      <span className="bg-nebula-purple/10 text-nebula-purple text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Briefcase size={12} /> {project.name || 'Projet inconnu'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

               {/* Actions sur l'item */}
               <div className="mt-3 pt-3 border-t border-white/5 flex justify-start items-center gap-2">
                 <Button variant="ghost" size="sm" iconLeft={<MessageSquare size={14} />} onClick={() => !isDeletingThisItem && handleCommentOnItem(item.id)} className="text-moon-gray hover:text-star-white" title="Commenter (non implémenté)" disabled={isDeletingThisItem || showCreateTicketModal}>Commenter</Button>
                 <Button variant="ghost" size="sm" iconLeft={<Plus size={14} />} onClick={() => !isDeletingThisItem && handleOpenCreateTaskModal(item)} className="text-moon-gray hover:text-star-white" title="Créer une tâche à partir de cette note" disabled={isDeletingThisItem || showCreateTicketModal}>Créer tâche</Button>
                 {/* Placeholder pour un bouton "Lier à un projet" */}
                 {/* {!item.project_id && <Button variant="ghost" size="sm" iconLeft={<Briefcase size={14}/>} className="text-moon-gray hover:text-star-white">Lier projet</Button>} */}
                 <div className="flex-grow"></div> {/* Espace pour pousser le bouton supprimer à droite */}
                 <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className={`text-red-alert/60 hover:text-red-alert hover:bg-red-alert/10 p-1.5 ${isDeletingThisItem ? 'cursor-wait' : ''}`} title="Supprimer la note" disabled={!!deletingItemId || showCreateTicketModal}>
                   {isDeletingThisItem ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                 </Button>
               </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modale de Création de Ticket */}
      {showCreateTicketModal && selectedInboxItemForTicket && (
        <CreateTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => {
            setShowCreateTicketModal(false);
            setSelectedInboxItemForTicket(null);
          }}
          projectId={selectedInboxItemForTicket.project_id || undefined}
          projectName={selectedInboxItemForTicket.project_id ? projectsLinkedMap[selectedInboxItemForTicket.project_id]?.name : undefined}
          availableProjects={availableProjectsForModal}
          defaultTitle={selectedInboxItemForTicket.content.substring(0, 70)}
          defaultDescription={selectedInboxItemForTicket.content}
          initialStatus={TicketStatus.TODO}
          onTicketCreated={(newTicket: TicketType) => {
            console.log("Ticket créé depuis l'inbox:", newTicket);
            alert(`Ticket "${newTicket.title}" créé avec succès pour le projet "${projectsLinkedMap[newTicket.project_id]?.name || 'Non spécifié'}" !`);
            if(selectedInboxItemForTicket){ // Sécurité
                 handleDeleteItem(selectedInboxItemForTicket.id);
            }
            setShowCreateTicketModal(false);
            setSelectedInboxItemForTicket(null);
          }}
        />
      )}
    </div>
  );
};

export default InboxPage;