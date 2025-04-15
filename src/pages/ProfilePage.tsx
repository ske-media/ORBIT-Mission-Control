import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Mail, Shield, Calendar, Activity, Save, AlertCircle } from 'lucide-react'; // Added Save, AlertCircle
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile, supabase } from '../lib/supabase'; // Import supabase for updates
import { Database } from '../types/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // State to control form editing
  const [formData, setFormData] = useState<Partial<UserProfile>>({}); // State for form data
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!authUser) {
      setError("Utilisateur non authentifié.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSaveSuccess(false); // Reset success message on fetch
    try {
      const userProfileData = await getCurrentUserProfile();
      if (userProfileData) {
        setProfile(userProfileData);
        setFormData({ // Initialize form data
          name: userProfileData.name,
          email: userProfileData.email, // Email might not be editable depending on Supabase settings
          avatar: userProfileData.avatar,
          // Add other editable fields here if needed (e.g., 'job_title' if added to schema)
        });
      } else {
        setError("Profil utilisateur introuvable dans la base de données.");
        console.error("Profile fetch returned null for auth user ID:", authUser.id);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(`Erreur lors du chargement du profil: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]); // Use useCallback dependency


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveSuccess(false); // Reset success message on change
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !authUser) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    // Prepare only the fields we want to update
    const updates: Partial<UserProfile> = {
        name: formData.name,
        avatar: formData.avatar,
        // Do not include email if it's not meant to be updated here
        // role should likely be managed elsewhere (admin panel)
    };

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id); // Ensure update targets the correct user

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setIsEditing(false); // Exit editing mode on success
      // Refetch profile to show updated data immediately
      await fetchProfile();
       // Hide success message after a delay
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(`Erreur lors de la mise à jour du profil: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

   const handleCancelEdit = () => {
     setIsEditing(false);
     // Reset form data to original profile data
     if (profile) {
         setFormData({ name: profile.name, email: profile.email, avatar: profile.avatar });
     }
     setError(null);
     setSaveSuccess(false);
   }

  // --- Placeholder functions ---
  const handleChangePassword = () => {
      console.log("TODO: Implement password change flow");
      alert("Fonctionnalité de changement de mot de passe non implémentée.");
      // This typically involves a modal asking for current and new password,
      // then calling supabase.auth.updateUser({ password: newPassword })
  };

   const handleAvatarEdit = () => {
      console.log("TODO: Implement avatar upload/selection");
      alert("Fonctionnalité d'édition d'avatar non implémentée.");
      // This requires UI for file selection and using Supabase Storage API
      // For now, allow editing the URL directly if desired:
      // setFormData(prev => ({ ...prev, avatar: prompt("Enter new avatar URL:", prev.avatar || '') || prev.avatar }));
  }

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
        <div className="p-8 max-w-4xl mx-auto text-center">
            <div className="p-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center justify-center gap-3">
              <AlertCircle size={20} />
              <span>{error || "Profil utilisateur non disponible."}</span>
            </div>
        </div>
    );
  }

  // Determine role display name
  const roleDisplay = profile.role === 'admin' ? 'Administrateur' : 'Collaborateur';

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group"> {/* Added group for hover effect */}
            <Avatar
              src={isEditing ? formData.avatar || profile.avatar : profile.avatar} // Show form data if editing
              alt={profile.name}
              size="lg"
              className="w-28 h-28"
            />
             {/* Show edit button only if enabled, or always show and handle click */}
             <button
                onClick={handleAvatarEdit}
                title="Modifier l'avatar (non implémenté)"
                className="absolute bottom-0 right-0 bg-nebula-purple rounded-full p-2 border-2 border-deep-space cursor-pointer hover:bg-nebula-purple-light transition-colors"
             >
               <Edit size={14} className="text-star-white" />
             </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-orbitron text-star-white mb-2">{profile.name}</h1>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <Mail size={16} className="text-moon-gray" />
              <span className="text-moon-gray">{profile.email}</span> {/* Display original email, typically not changed */}
            </div>
            <div className="flex items-center gap-2 text-sm justify-center md:justify-start">
              <div className="bg-nebula-purple/20 text-nebula-purple px-3 py-1 rounded-full flex items-center gap-1">
                <Shield size={14} />
                <span>{roleDisplay}</span>
              </div>
              {/* 'Actif' status could be based on last_sign_in_at or removed if not meaningful */}
              <div className="bg-green-success/20 text-green-success px-3 py-1 rounded-full">
                Actif
              </div>
            </div>
          </div>
           {/* Edit/Save Buttons for overall profile */}
           {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)} iconLeft={<Edit size={16}/>}>
                  Modifier le Profil
              </Button>
           )}
        </div>

        {/* Stats Section (Placeholders or TODO: fetch real data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
           {/* TODO: Fetch real stats if needed */}
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
             <Activity size={20} className="text-nebula-purple" />
            <div>
              <p className="text-moon-gray">Tickets assignés</p>
              <h3 className="text-2xl font-orbitron text-star-white">-</h3> {/* Placeholder */}
            </div>
          </div>
           <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
             <Shield size={20} className="text-green-success" />
            <div>
              <p className="text-moon-gray">Tickets complétés</p>
              <h3 className="text-2xl font-orbitron text-star-white">-</h3>{/* Placeholder */}
            </div>
          </div>
           <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
             <Calendar size={20} className="text-yellow-warning" />
            <div>
              <p className="text-moon-gray">Membre depuis</p>
              {/* Calculate duration based on profile.created_at */}
              <h3 className="text-2xl font-orbitron text-star-white">
                 {profile.created_at ? new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short' }).format(new Date(profile.created_at)) : '-'}
              </h3>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <form onSubmit={handleSaveProfile}>
          <div className="bg-deep-space rounded-xl border border-white/10 mb-10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-orbitron text-star-white">Informations personnelles</h2>
                {isEditing && saveSuccess && (
                    <span className="text-sm text-green-success flex items-center gap-1">
                        <CheckCircle size={16}/> Enregistré!
                    </span>
                )}
            </div>
            <div className="p-6">
              {error && !saving && ( // Show non-saving errors here too
                <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
               )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-moon-gray mb-2">Nom complet</label>
                  <input
                    id="name"
                    name="name" // Add name attribute for handleInputChange
                    type="text"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none ${isEditing ? 'focus:border-nebula-purple' : 'opacity-70 cursor-default'}`}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-moon-gray mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    readOnly // Typically email is not changed via profile form
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none opacity-70 cursor-default"
                  />
                </div>
                 {/* Optional: Add other fields like Avatar URL if you want it editable as text */}
                 <div>
                    <label htmlFor="avatar" className="block text-sm text-moon-gray mb-2">URL Avatar</label>
                    <input
                        id="avatar"
                        name="avatar"
                        type="text"
                        value={formData.avatar || ''}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        placeholder="https://..."
                        className={`w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none ${isEditing ? 'focus:border-nebula-purple' : 'opacity-70 cursor-default'}`}
                    />
                 </div>
                {/* Removed Poste and Fuseau Horaire as they aren't in the 'users' schema */}
              </div>
              {isEditing && (
                <div className="mt-6 flex justify-end gap-3">
                   <Button variant="ghost" onClick={handleCancelEdit} type="button" disabled={saving}>
                     Annuler
                   </Button>
                   <Button variant="primary" type="submit" disabled={saving} iconLeft={saving ? null : <Save size={16}/>}>
                     {saving ? 'Enregistrement...' : 'Enregistrer'}
                   </Button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Account Security */}
        <div className="bg-deep-space rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-orbitron text-star-white">Sécurité du compte</h2>
          </div>
          <div className="p-6 flex justify-between items-center">
              <p className="text-moon-gray">Changez votre mot de passe.</p>
              <Button variant="outline" onClick={handleChangePassword}>
                  Changer le mot de passe
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;