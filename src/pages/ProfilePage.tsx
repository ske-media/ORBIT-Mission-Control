import React, { useState, useEffect, useCallback } from 'react';
import {
  Edit,
  Mail,
  Shield,
  Calendar,
  Activity,
  Save,
  AlertCircle,
  CheckCircle,
  User // Assure-toi que User est bien importé de lucide-react si tu l'utilises ailleurs
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getCurrentUserProfile } from '../lib/supabase'; // getCurrentUserProfile throw en cas d'erreur
import { Database } from '../types/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth(); // Utilisateur authentifié
  const [profile, setProfile] = useState<UserProfile | null>(null); // Données du profil chargées
  const [formData, setFormData] = useState<Partial<UserProfile>>({}); // Données du formulaire en cours d'édition

  // --- State pour Loading/Error/Success ---
  const [loading, setLoading] = useState(true); // Pour le chargement initial du profil
  const [error, setError] = useState<string | null>(null); // Pour l'erreur de chargement initial
  const [saving, setSaving] = useState(false); // Pour l'état de sauvegarde des modifs
  const [saveError, setSaveError] = useState<string | null>(null); // Pour l'erreur de sauvegarde
  const [saveSuccess, setSaveSuccess] = useState(false); // Pour le message de succès de sauvegarde
  const [isEditing, setIsEditing] = useState(false); // Pour l'état d'édition du formulaire

  // --- Fetch Profile Data ---
  const fetchProfile = useCallback(async () => {
    // Vérification Auth User (bien que la route soit protégée)
    if (!authUser) {
      setError("Utilisateur non authentifié.");
      setLoading(false);
      return;
    }

    setLoading(true); // Début chargement initial
    setError(null);   // Reset erreur initiale
    setSaveSuccess(false); // Reset succès
    setSaveError(null);   // Reset erreur sauvegarde

    try {
      // getCurrentUserProfile throw l'erreur si échec
      const userProfileData = await getCurrentUserProfile();

      if (userProfileData) {
        setProfile(userProfileData); // Met à jour le profil affiché
        // Initialise le formulaire avec les données chargées
        setFormData({
          name: userProfileData.name,
          email: userProfileData.email, // Email n'est pas modifiable ici
          avatar: userProfileData.avatar
        });
      } else {
        // Cas où le profil n'existe pas dans public.users (rare si trigger fonctionne)
        setError("Profil utilisateur introuvable. Veuillez patienter ou contacter le support.");
        console.warn("Profile fetch returned null for auth user ID:", authUser.id);
      }
    } catch (err) { // Capture l'erreur levée par getCurrentUserProfile
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du profil.'); // Met l'état d'erreur initiale
    } finally {
      setLoading(false); // Fin chargement initial
    }
  }, [authUser]); // Dépendance à authUser pour re-fetch si l'utilisateur change

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Handlers ---

  // Gère les changements dans les inputs du formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> // Seulement des inputs ici
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveSuccess(false); // Cache le message succès dès qu'on re-modifie
    setSaveError(null);   // Cache le message erreur dès qu'on re-modifie
  };

  // Sauvegarde les modifications du profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Vérifie si le profil est chargé (sécurité)
    if (!profile) return;

    setSaving(true);    // Début sauvegarde
    setSaveError(null); // Reset erreur sauvegarde
    setSaveSuccess(false); // Reset succès

    try {
      // Prépare les données à mettre à jour
      const updates: Partial<UserProfile> = {
        name: formData.name,
        avatar: formData.avatar
        // email et role ne sont pas modifiables ici
        // updated_at sera géré par la fonction update de la lib si besoin, ou par trigger DB
      };

      // Appel Supabase pour mettre à jour la table 'users'
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id); // Cible l'utilisateur correct

      // Si Supabase renvoie une erreur
      if (updateError) {
        throw updateError; // Lance l'erreur pour le bloc catch
      }

      // Si succès :
      setSaveSuccess(true); // Affiche message succès
      setIsEditing(false); // Sort du mode édition
      await fetchProfile(); // Rafraîchit les données affichées depuis la DB

      // Cache le message succès après 3 secondes
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) { // Capture l'erreur de l'update
      console.error("Error updating profile:", err);
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil.'); // Met l'état d'erreur de sauvegarde
    } finally {
      setSaving(false); // Fin sauvegarde
    }
  };

  // Annule le mode édition et réinitialise le formulaire
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Réinitialise formData avec les données actuelles du profil
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar
      });
    }
    setSaveError(null); // Efface les erreurs de sauvegarde précédentes
    setSaveSuccess(false); // Efface les messages de succès précédents
  };

  // Placeholder pour le changement de mot de passe (à implémenter, voir SettingsPage)
  const handleChangePassword = () => {
    alert("Fonction de changement de mot de passe à implémenter (voir page Paramètres).");
    // Idéalement, rediriger vers SettingsPage#security ou ouvrir une modal dédiée
  };

  // Placeholder simple pour éditer l'URL de l'avatar (une vraie implémentation utiliserait Supabase Storage)
  const handleAvatarEdit = () => {
    // Ne rien faire si on est en train de sauvegarder
    if (saving) return;
    // Permettre l'édition uniquement si on est en mode édition
    if (!isEditing) {
       setIsEditing(true); // Passe en mode édition si on clique sur l'avatar
       return;
    }
    // Si déjà en mode édition, proposer de changer l'URL (placeholder)
    const url = prompt("Nouvelle URL d'avatar :", formData.avatar || profile?.avatar || '');
    if (url !== null) { // Vérifie que l'utilisateur n'a pas cliqué sur Annuler
      setFormData(prev => ({ ...prev, avatar: url }));
      setSaveSuccess(false); // Reset succès car modification non sauvegardée
      setSaveError(null);
    }
  };

  // --- Render Logic ---

  // 1. Affichage pendant le chargement initial
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  // 2. Affichage en cas d'erreur de chargement initial ou si profil non trouvé
  if (error || !profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
          <AlertCircle size={32} />
          <span>{error || "Profil utilisateur non disponible."}</span>
          {/* Bouton Réessayer uniquement en cas d'erreur de fetch */}
          {error && !profile && <Button variant="outline" size="sm" onClick={fetchProfile}>Réessayer</Button>}
        </div>
      </div>
    );
  }

  // 3. Affichage normal de la page
  const roleDisplay = profile.role === 'admin' ? 'Administrateur' : 'Collaborateur';

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* --- Header Section --- */}
        <div className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar et bouton Edit */}
          <div className="relative group">
            <Avatar
              // Affiche l'avatar du formulaire si en édition, sinon celui du profil chargé
              src={isEditing ? formData.avatar || profile.avatar : profile.avatar}
              alt={profile.name}
              size="lg"
              className="w-28 h-28"
            />
            {/* Bouton Edit sur l'avatar (cliquable seulement si non saving) */}
            <button
              type="button"
              onClick={handleAvatarEdit}
              title={isEditing ? "Modifier l'URL de l'avatar (simple)" : "Passer en mode édition"}
              className={`absolute bottom-0 right-0 bg-nebula-purple rounded-full p-2 border-2 border-deep-space hover:bg-nebula-purple-light transition-colors ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              disabled={saving}
            >
              <Edit size={14} className="text-star-white" />
            </button>
          </div>

          {/* Infos Utilisateur */}
          <div className="flex-1 text-center md:text-left">
            {/* Affiche le nom depuis formData si en édition, sinon depuis profile */}
            <h1 className="text-3xl font-orbitron text-star-white mb-2">
              {isEditing ? formData.name : profile.name}
            </h1>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <Mail size={16} className="text-moon-gray" />
              <span className="text-moon-gray">{profile.email}</span> {/* Email (non modifiable) */}
            </div>
            <div className="flex items-center gap-2 text-sm justify-center md:justify-start">
              <div className="bg-nebula-purple/20 text-nebula-purple px-3 py-1 rounded-full flex items-center gap-1">
                <Shield size={14} />
                <span>{roleDisplay}</span> {/* Rôle */}
              </div>
              {/* Statut (placeholder) */}
              <div className="bg-green-success/20 text-green-success px-3 py-1 rounded-full">
                Actif
              </div>
            </div>
          </div>

          {/* Bouton "Modifier le profil" (visible seulement si PAS en mode édition) */}
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => { setIsEditing(true); setSaveError(null); setSaveSuccess(false); }} // Passe en mode édition
              iconLeft={<Edit size={16} />}
              disabled={loading || saving} // Désactivé si chargement initial ou sauvegarde
            >
              Modifier le profil
            </Button>
          )}
        </div>

        {/* --- Stats Section (placeholders) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* ... (contenu des cartes stats inchangé) ... */}
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <Activity size={20} className="text-nebula-purple" />
            <div><p className="text-moon-gray">Tickets assignés</p><h3 className="text-2xl font-orbitron text-star-white">–</h3></div>
          </div>
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <Shield size={20} className="text-green-success" />
            <div><p className="text-moon-gray">Tickets complétés</p><h3 className="text-2xl font-orbitron text-star-white">–</h3></div>
          </div>
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <Calendar size={20} className="text-yellow-warning" />
            <div><p className="text-moon-gray">Membre depuis</p><h3 className="text-2xl font-orbitron text-star-white">{profile.created_at ? new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short' }).format(new Date(profile.created_at)) : '–'}</h3></div>
          </div>
        </div>

        {/* --- Profile Form Section --- */}
        {/* Le formulaire est toujours rendu, mais les inputs sont readOnly si !isEditing */}
        <form onSubmit={handleSaveProfile}>
          <div className="bg-deep-space rounded-xl border border-white/10 mb-10">
            {/* Form Header avec indicateur Succès */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-orbitron text-star-white">Informations personnelles</h2>
              {/* Indicateur Succès (visible seulement si succès et PAS en train de sauvegarder) */}
              {saveSuccess && !saving && (
                <span className="text-sm text-green-success flex items-center gap-1 transition-opacity duration-300">
                  <CheckCircle size={16} />
                  Enregistré !
                </span>
              )}
            </div>

            {/* Form Body avec indicateur Erreur */}
            <div className="p-6">
              {/* Affichage Erreur Sauvegarde (visible seulement si erreur et PAS en train de sauvegarder) */}
              {saveError && !saving && (
                <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle size={18} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm text-moon-gray mb-2">Nom complet</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    readOnly={!isEditing || saving} // Non éditable si pas en mode édition OU si sauvegarde en cours
                    className={`w-full bg-space-black border rounded-lg px-4 py-3 text-star-white focus:outline-none ${!isEditing || saving ? 'border-white/10 opacity-70 cursor-default' : 'border-white/10 focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple'} ${saving ? 'cursor-wait' : ''}`}
                  />
                </div>
                {/* Email Input (Toujours ReadOnly) */}
                <div>
                  <label htmlFor="email" className="block text-sm text-moon-gray mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''} // Affiche l'email
                    readOnly // Jamais modifiable ici
                    className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white opacity-70 cursor-default"
                  />
                </div>
                {/* Avatar URL Input */}
                <div>
                  <label htmlFor="avatar" className="block text-sm text-moon-gray mb-2">URL Avatar</label>
                  <input
                    id="avatar"
                    name="avatar"
                    type="text"
                    value={formData.avatar || ''}
                    onChange={handleInputChange}
                    readOnly={!isEditing || saving} // Non éditable si pas en mode édition OU si sauvegarde en cours
                    placeholder="https://..."
                    className={`w-full bg-space-black border rounded-lg px-4 py-3 text-star-white focus:outline-none ${!isEditing || saving ? 'border-white/10 opacity-70 cursor-default' : 'border-white/10 focus:border-nebula-purple focus:ring-1 focus:ring-nebula-purple'} ${saving ? 'cursor-wait' : ''}`}
                  />
                </div>
              </div>

              {/* Actions du formulaire (visibles seulement en mode édition) */}
              {isEditing && (
                <div className="mt-6 flex justify-end gap-3">
                  {/* Bouton Annuler */}
                  <Button variant="ghost" type="button" onClick={handleCancelEdit} disabled={saving}>
                    Annuler
                  </Button>
                  {/* Bouton Enregistrer */}
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={saving} // Désactivé pendant la sauvegarde
                    iconLeft={saving ? null : <Save size={16} />} // Icône change si sauvegarde
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'} {/* Texte change si sauvegarde */}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* --- Account Security Section --- */}
        {/* (Ajouter gestion loading/error si handleChangePassword est implémenté) */}
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