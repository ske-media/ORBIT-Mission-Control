// src/components/projects/ProjectMembersModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, Check, ChevronDown, AlertCircle, Search, Loader2 } from 'lucide-react';
import {
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  getUsersToInvite,
  createNotification
} from '../../lib/supabase';
import { Database } from '../../types/supabase';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

type UserType = Database['public']['Tables']['users']['Row'];
type ProjectMemberType = Database['public']['Tables']['project_members']['Row'];

interface ProjectMemberWithUser extends ProjectMemberType {
  user: UserType;
}

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  ownerId: string;
  onMembersUpdate: () => void;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  ownerId,
  onMembersUpdate,
}) => {
  const { user: authUser } = useAuth(); // Pour obtenir le nom de l'utilisateur actuel (l'inviteur/modificateur)
  const currentUserId = authUser?.id;

  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [inviteSearchTerm, setInviteSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<UserType | null>(null);
  const [selectedRoleToInvite, setSelectedRoleToInvite] = useState<'editor'>('editor');

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingUpdateRole, setLoadingUpdateRole] = useState<string | null>(null);
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingSearch(true);
      setMembers([]);
      setInviteSearchTerm('');
      setSearchResults([]);
      setSelectedUserToInvite(null);
      setSelectedRoleToInvite('editor');
      setError(null);
      fetchProjectMembers();
    }
  }, [isOpen, projectId]);

  const fetchProjectMembers = async () => {
    try {
      console.log('Début fetchProjectMembers pour le projet:', projectId);
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Erreur lors du chargement des membres:', error);
        throw error;
      }

      console.log('Membres chargés avec succès:', data);
      setMembers(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setError('Erreur lors du chargement des membres');
    } finally {
      setLoadingSearch(false);
    }
  };

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

  const handleRoleChange = async (userIdToUpdate: string, newRole: 'owner' | 'editor') => {
    if (!currentUserId) {
      toast.error('Vous devez être connecté pour effectuer cette action');
      return;
    }

    if (isUpdating) return;
    if (userIdToUpdate === currentUserId) {
      console.log('Action bloquée : tentative de modifier son propre rôle');
      return;
    }
    if (userIdToUpdate === ownerId) {
      console.log('Action bloquée : tentative de modifier le rôle du propriétaire');
      return;
    }

    setIsUpdating(true);
    console.log('Tentative de changement de rôle:', {
      userIdToUpdate,
      newRole,
      currentUserId,
      ownerId,
      projectId,
      member: members.find(m => m.user_id === userIdToUpdate)
    });

    try {
      const result = await updateProjectMemberRole(projectId, userIdToUpdate, newRole);
      
      if (result.success) {
        setMembers(prevMembers =>
          prevMembers.map(member =>
            member.user_id === userIdToUpdate
              ? { ...member, role: newRole }
              : member
          )
        );
        toast.success('Rôle mis à jour avec succès');
        onMembersUpdate();
      } else {
        console.error('Erreur lors de la mise à jour du rôle:', result.error);
        toast.error(result.error || 'Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
     if (loadingRemove || userIdToRemove === ownerId || userIdToRemove === currentUserId) return;
     const memberToRemove = members.find(m => m.user_id === userIdToRemove)?.user;
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
      setSelectedRoleToInvite('editor');
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
  members.forEach(m => { if (m.user) usersMap[m.user.id] = m.user });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-space-black border border-white/10 rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-star-white">Membres du projet</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-moon-gray hover:text-star-white"
          >
            <X size={20} />
          </Button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={18} /> <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-alert/70 hover:text-red-alert p-1 rounded-full hover:bg-red-alert/10"><X size={16}/></button>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-star-white mb-3">Membres Actuels ({members.length})</h3>
            {members.length === 0 && <p className="text-sm text-moon-gray italic">Aucun membre dans ce projet pour l'instant.</p>}
            <ul className="space-y-3">
              {members.map((member) => {
                if (!member.user) return null;
                const user = member.user;
                const isCurrentUserTheOwner = user.id === ownerId;
                const isSelf = user.id === currentUserId;
                const isProcessingRole = loadingUpdateRole === user.id;
                const isProcessingRemove = loadingRemove === user.id;

                return (
                  <li key={user.id} className={`flex items-center justify-between p-3 bg-deep-space rounded-lg border border-white/5 transition-all duration-200 ${isProcessingRole || isProcessingRemove ? 'opacity-50' : 'hover:border-white/10'}`}>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} alt={user.name} size="md" />
                      <div>
                        <span className="text-star-white font-medium block">{user.name} {isSelf && !isCurrentUserTheOwner ? <span className="text-xs text-nebula-purple/80">(Vous)</span> : ''}</span>
                        <span className={`text-xs ${isCurrentUserTheOwner ? 'text-yellow-warning font-semibold' : 'text-moon-gray'}`}>
                          {member.role === 'owner' ? 'Propriétaire' : 'Éditeur'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCurrentUserTheOwner && !isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(user.id)}
                          disabled={isProcessingRole || isProcessingRemove || loadingInvite}
                          className="text-red-alert/70 hover:text-red-alert hover:bg-red-alert/10 p-1.5"
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
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={inviteSearchTerm}
                onChange={(e) => { setInviteSearchTerm(e.target.value); setSelectedUserToInvite(null); }}
                className="w-full bg-deep-space border border-white/10 rounded-lg pl-10 pr-4 py-2 text-star-white focus:outline-none focus:border-nebula-purple/50 placeholder:text-moon-gray"
                disabled={loadingInvite || !!loadingRemove || !!loadingUpdateRole}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none" size={18} />
              {loadingSearch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-gray animate-spin" size={16}/>}
            </div>

            {searchResults.length > 0 && !selectedUserToInvite && (
              <ul className="max-h-40 overflow-y-auto bg-deep-space border border-white/10 rounded-lg shadow-lg mt-1">
                {searchResults.map(user => (
                  <li
                    key={user.id}
                    onClick={() => { setSelectedUserToInvite(user); setSearchResults([]); setInviteSearchTerm(user.name); }}
                    className="p-2 flex items-center gap-2 hover:bg-nebula-purple/10 cursor-pointer text-sm"
                  >
                    <Avatar src={user.avatar} alt={user.name} size="sm" />
                    <span className="text-star-white">{user.name}</span>
                    <span className="text-moon-gray ml-auto truncate">{user.email}</span>
                  </li>
                ))}
              </ul>
            )}

            {selectedUserToInvite && (
              <div className="flex items-center gap-3 p-3 bg-deep-space rounded-lg border border-white/5">
                <Avatar src={selectedUserToInvite.avatar} alt={selectedUserToInvite.name} size="md" />
                <div className="flex-1">
                  <span className="text-star-white font-medium block">{selectedUserToInvite.name}</span>
                  <span className="text-xs text-moon-gray block">{selectedUserToInvite.email}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInviteUser}
                  disabled={loadingInvite}
                  className="flex items-center gap-2"
                >
                  {loadingInvite ? (
                    <><Loader2 size={16} className="animate-spin"/>Invitation...</>
                  ) : (
                    <><UserPlus size={16}/>Inviter</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;