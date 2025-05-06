// src/components/projects/ProjectMembersModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, Check, ChevronDown, AlertCircle, Search, Loader2 } from 'lucide-react'; // Ajout Loader2
import { supabase, addProjectMember, updateProjectMemberRole, removeProjectMember, getUsersToInvite, ProjectMemberWithUser } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

type UserType = Database['public']['Tables']['users']['Row'];
// ProjectMemberWithUser est maintenant importé de lib/supabase

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  ownerId: string | null;
  currentUserId: string;
  initialMembers: ProjectMemberWithUser[];
  onMembersUpdate: () => void; // Callback pour rafraîchir
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  ownerId,
  currentUserId,
  initialMembers,
  onMembersUpdate,
}) => {
  const [members, setMembers] = useState<ProjectMemberWithUser[]>(initialMembers);
  const [inviteSearchTerm, setInviteSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<UserType | null>(null);
  const [selectedRoleToInvite, setSelectedRoleToInvite] = useState<'editor' | 'viewer'>('viewer');

  // --- State for Loading/Error ---
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingUpdateRole, setLoadingUpdateRole] = useState<string | null>(null); // Store user ID being updated
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null); // Store user ID being removed
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or initial members change
  useEffect(() => {
      if (isOpen) {
          setMembers(initialMembers);
          setInviteSearchTerm('');
          setSearchResults([]);
          setSelectedUserToInvite(null);
          setSelectedRoleToInvite('viewer');
          setError(null);
          // Ne pas reset les loading states ici car une action peut être en cours
      }
  }, [isOpen, initialMembers]);


  // --- Debounced User Search ---
  const searchUsers = useCallback(async (term: string) => {
      if (!term.trim()) {
          setSearchResults([]);
          return;
      }
      setLoadingSearch(true);
      setError(null);
      try {
          const users = await getUsersToInvite(projectId, term);
          setSearchResults(users);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur lors de la recherche d'utilisateurs.");
          setSearchResults([]);
      } finally {
          setLoadingSearch(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // On ne veut pas redéclencher sur chaque frappe, seulement sur projectId

  useEffect(() => {
      const handler = setTimeout(() => {
          searchUsers(inviteSearchTerm);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(handler);
  }, [inviteSearchTerm, searchUsers]);


  // --- Handlers ---
  const handleRoleChange = async (userId: string, newRole: 'editor' | 'viewer') => {
    if (loadingUpdateRole || userId === ownerId) return;
    setLoadingUpdateRole(userId);
    setError(null);
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
      // Option 1: Rafraîchir via callback (plus simple)
      onMembersUpdate();
      // Option 2: Mettre à jour l'état local (plus réactif mais peut désynchroniser)
      // setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du rôle.");
    } finally {
      setLoadingUpdateRole(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
     if (loadingRemove || userId === ownerId || userId === currentUserId) return;

     if (!window.confirm(`Voulez-vous vraiment retirer ce membre (${usersMap[userId]?.name || userId}) du projet ?`)) return;

     setLoadingRemove(userId);
     setError(null);
     try {
       await removeProjectMember(projectId, userId);
       onMembersUpdate(); // Rafraîchit la liste via callback
       // setMembers(prev => prev.filter(m => m.user_id !== userId)); // Alternative locale
     } catch (err) {
       setError(err instanceof Error ? err.message : "Erreur lors de la suppression du membre.");
     } finally {
       setLoadingRemove(null);
     }
  };

  const handleInviteUser = async () => {
    if (!selectedUserToInvite || loadingInvite) return;
    setLoadingInvite(true);
    setError(null);
    try {
      await addProjectMember(projectId, selectedUserToInvite.id, selectedRoleToInvite);
      onMembersUpdate(); // Rafraîchit via callback
      // Reset invite state
      setInviteSearchTerm('');
      setSearchResults([]);
      setSelectedUserToInvite(null);
      setSelectedRoleToInvite('viewer');
    } catch (err) {
        // Gérer le cas spécifique de la contrainte unique (membre déjà présent)
        if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint "project_members_pkey"')) {
            setError(`${selectedUserToInvite.name} est déjà membre de ce projet.`);
        } else {
            setError(err instanceof Error ? err.message : "Erreur lors de l'invitation.");
        }
    } finally {
      setLoadingInvite(false);
    }
  };

   // Helper pour obtenir les données utilisateur depuis la map (évite les répétitions)
   const usersMap: Record<string, UserType> = {};
   initialMembers.forEach(m => { if (m.users) usersMap[m.users.id] = m.users });

  // --- Render ---
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-white/10 shadow-xl" // Augmenté max-h
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-orbitron text-star-white">Gérer les Membres</h2>
            <button onClick={onClose} className="text-moon-gray hover:text-star-white transition-colors disabled:opacity-50" disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole}>
              <X size={24} />
            </button>
          </div>

          {/* Error Display */}
           {error && (
             <div className="p-3 border-b border-white/10 bg-red-alert/10 text-red-alert text-sm flex items-center gap-2 flex-shrink-0">
               <AlertCircle size={18} />
               <span className='flex-1'>{error}</span> {/* flex-1 pour prendre la place */}
                <button onClick={() => setError(null)} className="text-red-alert/70 hover:text-red-alert flex-shrink-0"><X size={16}/></button>
             </div>
           )}

          {/* Content Area (Scrollable) */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">

            {/* Current Members List */}
            <div>
              <h3 className="text-lg font-medium text-star-white mb-3">Membres Actuels</h3>
              {members.length === 0 && <p className="text-sm text-moon-gray italic">Aucun membre pour l'instant.</p>}
              <ul className="space-y-3">
                {members.map((member) => {
                  if (!member.users) return null; // Ne devrait pas arriver si la query est bonne
                  const user = member.users;
                  const isCurrentUserOwner = user.id === ownerId;
                  const isProcessingRole = loadingUpdateRole === user.id;
                  const isProcessingRemove = loadingRemove === user.id;
                  const isSelf = user.id === currentUserId;

                  return (
                    <li key={user.id} className={`flex items-center justify-between p-3 bg-space-black/30 rounded-lg transition-opacity duration-200 ${isProcessingRole || isProcessingRemove ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3 overflow-hidden"> {/* Added overflow-hidden */}
                        <Avatar src={user.avatar} alt={user.name} size="md" />
                        <div className="overflow-hidden"> {/* Added overflow-hidden */}
                          <span className="text-star-white font-medium block truncate" title={user.name}>{user.name} {isSelf ? '(Vous)' : ''}</span>
                          <span className={`block text-xs truncate ${isCurrentUserOwner ? 'text-yellow-warning' : 'text-moon-gray'}`}>
                            {member.role === 'owner' ? 'Propriétaire' : member.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0"> {/* Added flex-shrink-0 */}
                        {/* Role Selector (if not owner) */}
                        {!isCurrentUserOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'editor' | 'viewer')}
                            disabled={isProcessingRole || isProcessingRemove || !!loadingUpdateRole || !!loadingRemove || loadingInvite}
                            className={`bg-space-black border border-white/10 rounded-md px-2 py-1 text-xs text-star-white focus:outline-none focus:border-nebula-purple appearance-none ${isProcessingRole || isProcessingRemove ? 'cursor-wait' : ''}`}
                            aria-label={`Rôle de ${user.name}`}
                          >
                             {/* Option vide si chargement pour éviter changement visuel */}
                            {isProcessingRole && <option value={member.role}>...</option>}
                            {!isProcessingRole && <>
                                <option value="editor">Éditeur</option>
                                <option value="viewer">Lecteur</option>
                            </>}
                          </select>
                        )}
                         {/* Remove Button (if not owner and not self) */}
                         {!isCurrentUserOwner && !isSelf && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleRemoveMember(user.id)}
                             disabled={isProcessingRole || isProcessingRemove || !!loadingUpdateRole || !!loadingRemove || loadingInvite}
                             className="text-red-alert/70 hover:text-red-alert hover:bg-red-alert/10 p-1"
                             title={`Retirer ${user.name}`}
                           >
                             {isProcessingRemove ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                           </Button>
                         )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Invite New Members Section */}
            <div>
              <h3 className="text-lg font-medium text-star-white mb-3">Inviter un Membre</h3>
              {/* Search Input */}
              <div className="relative mb-1">
                 <input
                   type="text"
                   placeholder="Rechercher par nom ou email..."
                   value={inviteSearchTerm}
                   onChange={(e) => { setInviteSearchTerm(e.target.value); setSelectedUserToInvite(null); }}
                   className="w-full bg-space-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
                   disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole} // Désactiver si une autre action est en cours
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
                 {loadingSearch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-gray animate-spin" size={16}/>}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && !selectedUserToInvite && (
                <ul className="max-h-40 overflow-y-auto bg-deep-space border border-white/10 rounded-lg shadow-lg mt-1 z-10 absolute w-[calc(100%-3rem)]"> {/* Ajusté pour la largeur */}
                  {searchResults.map(user => (
                    <li
                      key={user.id}
                      onClick={() => { setSelectedUserToInvite(user); setSearchResults([]); setInviteSearchTerm(user.name); }}
                      className="p-2 flex items-center gap-2 hover:bg-nebula-purple/10 cursor-pointer text-sm"
                    >
                      <Avatar src={user.avatar} alt={user.name} size="sm" />
                      <span className="text-star-white">{user.name}</span>
                      <span className="text-moon-gray ml-auto">{user.email}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Invite Form (appears when a user is selected) */}
              {selectedUserToInvite && (
                 <div className="flex items-center gap-2 mt-3 p-3 bg-space-black/30 rounded-lg">
                    <Avatar src={selectedUserToInvite.avatar} alt={selectedUserToInvite.name} size="md" />
                    <div className="flex-1 overflow-hidden">
                        <span className="text-star-white font-medium block truncate">{selectedUserToInvite.name}</span>
                        <span className='block text-xs text-moon-gray truncate'>{selectedUserToInvite.email}</span>
                    </div>
                    <select
                        value={selectedRoleToInvite}
                        onChange={(e) => setSelectedRoleToInvite(e.target.value as 'editor' | 'viewer')}
                        disabled={loadingInvite}
                        className={`bg-space-black border border-white/10 rounded-md px-2 py-1 text-xs text-star-white focus:outline-none focus:border-nebula-purple appearance-none ${loadingInvite ? 'cursor-wait' : ''}`}
                        aria-label="Rôle pour l'invitation"
                    >
                        <option value="viewer">Lecteur</option>
                        <option value="editor">Éditeur</option>
                    </select>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleInviteUser}
                        disabled={loadingInvite}
                        iconLeft={loadingInvite ? null : <UserPlus size={16} />}
                    >
                        {loadingInvite ? 'Invitation...' : 'Inviter'}
                    </Button>
                 </div>
              )}
            </div>

          </div> {/* End Scrollable Content */}

          {/* Footer */}
           <div className="p-4 border-t border-white/10 flex justify-end flex-shrink-0">
             <Button variant="ghost" onClick={onClose} disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole}>Fermer</Button>
           </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectMembersModal;