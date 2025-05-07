// src/components/projects/ProjectMembersModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, Check, ChevronDown, AlertCircle, Search, Loader2 } from 'lucide-react';
import {
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  getUsersToInvite,
  ProjectMemberWithUser, // Type exporté de lib/supabase
  createNotification     // <<--- IMPORTER createNotification
} from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext'; // <<--- IMPORTER useAuth

type UserType = Database['public']['Tables']['users']['Row'];

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string; // Pour les messages de notification
  ownerId: string | null;
  currentUserId: string; // ID de l'utilisateur connecté qui effectue les actions
  initialMembers: ProjectMemberWithUser[];
  onMembersUpdate: () => void;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName, // Récupérer le nom du projet
  ownerId,
  currentUserId, // C'est l'ID de l'utilisateur qui est en train d'utiliser la modal
  initialMembers,
  onMembersUpdate,
}) => {
  const { user: authUser } = useAuth(); // Pour obtenir le nom de l'utilisateur actuel (l'inviteur/modificateur)

  const [members, setMembers] = useState<ProjectMemberWithUser[]>(initialMembers);
  const [inviteSearchTerm, setInviteSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<UserType | null>(null);
  const [selectedRoleToInvite, setSelectedRoleToInvite] = useState<'editor' | 'viewer'>('viewer');

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingUpdateRole, setLoadingUpdateRole] = useState<string | null>(null);
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (isOpen) {
          setMembers(initialMembers);
          setInviteSearchTerm('');
          setSearchResults([]);
          setSelectedUserToInvite(null);
          setSelectedRoleToInvite('viewer');
          setError(null);
      }
  }, [isOpen, initialMembers]);

  const searchUsers = useCallback(async (term: string) => {
      if (!term.trim()) { setSearchResults([]); return; }
      setLoadingSearch(true); setError(null);
      try {
          const users = await getUsersToInvite(projectId, term);
          setSearchResults(users.filter(u => u.id !== currentUserId && !members.find(m => m.user_id === u.id))); // Exclut soi-même et les membres actuels
      } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur recherche utilisateurs.");
          setSearchResults([]);
      } finally { setLoadingSearch(false); }
  }, [projectId, currentUserId, members]);

  useEffect(() => {
      const handler = setTimeout(() => { searchUsers(inviteSearchTerm); }, 500);
      return () => clearTimeout(handler);
  }, [inviteSearchTerm, searchUsers]);

  const handleRoleChange = async (userIdToUpdate: string, newRole: 'editor' | 'viewer') => {
    if (loadingUpdateRole || userIdToUpdate === ownerId) return;
    setLoadingUpdateRole(userIdToUpdate); setError(null);
    try {
      const updatedMember = await updateProjectMemberRole(projectId, userIdToUpdate, newRole);
      onMembersUpdate(); // Rafraîchit la liste dans ProjectDetailPage

      // --- NOTIFICATION : CHANGEMENT DE RÔLE ---
      if (updatedMember && updatedMember.user_id !== currentUserId) { // Ne pas notifier l'acteur
        const changerName = authUser?.user_metadata?.name || "Quelqu'un";
        try {
          await createNotification({
            user_id: updatedMember.user_id, // Destinataire : l'utilisateur dont le rôle a changé
            content: `${changerName} a changé votre rôle à "${updatedMember.role}" dans le projet "${projectName || 'Non spécifié'}".`,
            type: 'project_updated', // ou un type plus spécifique comme 'project_role_changed'
            related_entity: 'project',
            related_id: projectId,
          });
        } catch (notifError) { console.error("Erreur création notif changement rôle:", notifError); }
      }
      // --- FIN NOTIFICATION ---

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour du rôle.");
    } finally { setLoadingUpdateRole(null); }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
     if (loadingRemove || userIdToRemove === ownerId || userIdToRemove === currentUserId) return;
     const memberToRemove = members.find(m => m.user_id === userIdToRemove)?.users;
     if (!window.confirm(`Voulez-vous vraiment retirer ${memberToRemove?.name || 'ce membre'} du projet "${projectName || ''}" ?`)) return;

     setLoadingRemove(userIdToRemove); setError(null);
     try {
       await removeProjectMember(projectId, userIdToRemove);
       onMembersUpdate();
       // Pas de notification pour le membre retiré car il n'a plus accès (et l'action est "négative")
     } catch (err) {
       setError(err instanceof Error ? err.message : "Erreur suppression du membre.");
     } finally { setLoadingRemove(null); }
  };

  const handleInviteUser = async () => {
    if (!selectedUserToInvite || loadingInvite) return;
    setLoadingInvite(true); setError(null);
    try {
      const newMemberEntry = await addProjectMember(projectId, selectedUserToInvite.id, selectedRoleToInvite);
      onMembersUpdate();

      // --- NOTIFICATION : AJOUT AU PROJET ---
      if (newMemberEntry && newMemberEntry.user_id !== currentUserId) { // Ne pas notifier l'inviteur
        const inviterName = authUser?.user_metadata?.name || "Quelqu'un de l'équipe";
        try {
          await createNotification({
            user_id: newMemberEntry.user_id, // Destinataire : le nouveau membre
            content: `${inviterName} vous a ajouté au projet "${projectName || 'Non spécifié'}" avec le rôle "${newMemberEntry.role}".`,
            type: 'project_updated', // ou 'project_member_added'
            related_entity: 'project',
            related_id: projectId,
          });
        } catch (notifError) { console.error("Erreur création notif ajout membre:", notifError); }
      }
      // --- FIN NOTIFICATION ---

      setInviteSearchTerm('');
      setSearchResults([]);
      setSelectedUserToInvite(null);
      setSelectedRoleToInvite('viewer');
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint "project_members_pkey"')) {
        setError(`${selectedUserToInvite.name} est déjà membre de ce projet.`);
      } else {
        setError(err instanceof Error ? err.message : "Erreur lors de l'invitation.");
      }
    } finally { setLoadingInvite(false); }
  };

  // Crée une map locale pour un accès facile aux noms pour les messages de confirmation
  const usersMap: Record<string, UserType> = {};
  members.forEach(m => { if (m.users) usersMap[m.users.id] = m.users });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative bg-deep-space rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-white/10 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "circOut" }}
        >
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-orbitron text-star-white">Gérer les Membres {projectName ? `de "${projectName}"` : ''}</h2>
            <button onClick={onClose} className="text-moon-gray hover:text-star-white transition-colors disabled:opacity-50 p-1 rounded-full hover:bg-white/10" disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole}>
              <X size={22} />
            </button>
          </div>

          {error && (
            <div className="p-3 mx-5 mt-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm flex-shrink-0">
              <AlertCircle size={18} /> <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-alert/70 hover:text-red-alert p-1 rounded-full hover:bg-red-alert/10"><X size={16}/></button>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
            <div>
              <h3 className="text-lg font-medium text-star-white mb-3">Membres Actuels ({members.length})</h3>
              {members.length === 0 && <p className="text-sm text-moon-gray italic">Aucun membre dans ce projet pour l'instant.</p>}
              <ul className="space-y-3">
                {members.map((member) => {
                  if (!member.users) return null;
                  const user = member.users;
                  const isCurrentUserTheOwner = user.id === ownerId;
                  const isSelf = user.id === currentUserId;
                  const isProcessingRole = loadingUpdateRole === user.id;
                  const isProcessingRemove = loadingRemove === user.id;

                  return (
                    <li key={user.id} className={`flex items-center justify-between p-3 bg-space-black/40 rounded-lg transition-opacity duration-200 ${isProcessingRole || isProcessingRemove ? 'opacity-50 cursor-progress' : ''}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar src={user.avatar} alt={user.name} size="md" />
                        <div className="overflow-hidden">
                          <span className="text-star-white font-medium block truncate" title={user.name}>{user.name} {isSelf && !isCurrentUserTheOwner ? <span className="text-xs text-nebula-purple/80">(Vous)</span> : ''}</span>
                          <span className={`block text-xs truncate ${isCurrentUserTheOwner ? 'text-yellow-warning font-semibold' : 'text-moon-gray'}`}>
                            {member.role === 'owner' ? 'Propriétaire' : member.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isCurrentUserTheOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'editor' | 'viewer')}
                            disabled={isProcessingRole || isProcessingRemove || !!loadingUpdateRole || !!loadingRemove || loadingInvite || isSelf} // On ne peut pas changer son propre rôle ici
                            className={`bg-space-black border border-white/10 rounded-md px-2 py-1 text-xs text-star-white focus:outline-none focus:border-nebula-purple appearance-none ${isProcessingRole || isProcessingRemove || isSelf ? 'cursor-not-allowed opacity-60' : 'hover:border-white/30'}`}
                            aria-label={`Rôle de ${user.name}`}
                          >
                            {isProcessingRole && <option value={member.role}>...</option>}
                            {!isProcessingRole && <>
                                <option value="editor">Éditeur</option>
                                <option value="viewer">Lecteur</option>
                            </>}
                          </select>
                        )}
                         {!isCurrentUserTheOwner && !isSelf && (
                           <Button
                             variant="ghost" size="sm"
                             onClick={() => handleRemoveMember(user.id)}
                             disabled={isProcessingRole || isProcessingRemove || !!loadingUpdateRole || !!loadingRemove || loadingInvite}
                             className="text-red-alert/70 hover:text-red-alert hover:bg-red-alert/10 p-1.5"
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

            <div>
              <h3 className="text-lg font-medium text-star-white mb-3">Inviter un Membre</h3>
              <div className="relative mb-1">
                 <input type="text" placeholder="Rechercher par nom ou email..." value={inviteSearchTerm} onChange={(e) => { setInviteSearchTerm(e.target.value); setSelectedUserToInvite(null); }} className="w-full bg-space-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray" disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole} />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
                 {loadingSearch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-gray animate-spin" size={16}/>}
              </div>

              {searchResults.length > 0 && !selectedUserToInvite && (
                <ul className="max-h-40 overflow-y-auto bg-deep-space border border-white/10 rounded-lg shadow-lg mt-1 z-10 absolute w-[calc(100%-3rem)] md:w-[calc(50%-2rem)]">
                  {searchResults.map(user => (
                    <li key={user.id} onClick={() => { setSelectedUserToInvite(user); setSearchResults([]); setInviteSearchTerm(user.name); }} className="p-2 flex items-center gap-2 hover:bg-nebula-purple/10 cursor-pointer text-sm">
                      <Avatar src={user.avatar} alt={user.name} size="sm" />
                      <span className="text-star-white">{user.name}</span>
                      <span className="text-moon-gray ml-auto truncate">{user.email}</span>
                    </li>
                  ))}
                </ul>
              )}

              {selectedUserToInvite && (
                 <div className="flex items-center gap-2 mt-3 p-3 bg-space-black/40 rounded-lg border border-white/5">
                    <Avatar src={selectedUserToInvite.avatar} alt={selectedUserToInvite.name} size="md" />
                    <div className="flex-1 overflow-hidden">
                        <span className="text-star-white font-medium block truncate">{selectedUserToInvite.name}</span>
                        <span className='block text-xs text-moon-gray truncate'>{selectedUserToInvite.email}</span>
                    </div>
                    <select value={selectedRoleToInvite} onChange={(e) => setSelectedRoleToInvite(e.target.value as 'editor' | 'viewer')} disabled={loadingInvite} className={`bg-space-black border border-white/10 rounded-md px-2 py-1 text-xs text-star-white focus:outline-none focus:border-nebula-purple appearance-none ${loadingInvite ? 'cursor-wait' : ''}`} aria-label="Rôle pour l'invitation">
                        <option value="viewer">Lecteur</option>
                        <option value="editor">Éditeur</option>
                    </select>
                    <Button variant="primary" size="sm" onClick={handleInviteUser} disabled={loadingInvite} iconLeft={loadingInvite ? null : <UserPlus size={16} />}>
                        {loadingInvite ? <><Loader2 size={16} className="animate-spin mr-1.5"/>Invitation...</> : 'Inviter'}
                    </Button>
                 </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-white/10 flex justify-end flex-shrink-0">
             <Button variant="ghost" onClick={onClose} disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole}>Fermer</Button>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectMembersModal;