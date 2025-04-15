import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Bell, Moon, Volume2, Globe, Shield, Key, Mail, Save, CheckCircle, AlertCircle } from 'lucide-react'; // Added Save, CheckCircle, AlertCircle
import Button from '../components/ui/Button';
import { getNotificationSettings, updateNotificationSettings, supabase } from '../lib/supabase'; // Import supabase for auth updates
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

type NotificationSettingsType = Database['public']['Tables']['notification_settings']['Row'];
type NotificationType = 'ticket_assigned' | 'ticket_updated' | 'project_created' | 'project_updated' | 'deadline_approaching' | 'mention';

// Interface for storing local settings (like theme)
interface LocalSettings {
    theme: 'dark' | 'light' | 'system';
    soundEffects: boolean;
    animations: boolean;
    language: 'fr' | 'en' | 'es'; // Example languages
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interface' | 'notifications' | 'security' | 'api'>('notifications'); // Default to notifications
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType | null>(null);
  const [loadingNotifSettings, setLoadingNotifSettings] = useState(true);
  const [savingNotifSettings, setSavingNotifSettings] = useState(false);
  const [savedNotifSettings, setSavedNotifSettings] = useState(false);
  const [errorNotifSettings, setErrorNotifSettings] = useState<string | null>(null);

  // --- State for Interface Settings (Example using localStorage) ---
  const [localSettings, setLocalSettings] = useState<LocalSettings>(() => {
      // Load saved settings or defaults
      const saved = localStorage.getItem('orbitAppSettings');
      const defaults: LocalSettings = { theme: 'dark', soundEffects: true, animations: true, language: 'fr' };
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  // State for Security Tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);


  const { user: authUser } = useAuth(); // Get auth user for security actions

  // --- Fetch Notification Settings ---
  const fetchNotificationSettings = useCallback(async () => {
    setLoadingNotifSettings(true);
    setErrorNotifSettings(null);
    setSavedNotifSettings(false);
    try {
      const data = await getNotificationSettings(); // This handles default creation
      if (data) {
          setNotificationSettings(data);
      } else {
           // Error should be logged inside getNotificationSettings if profile missing
           throw new Error("Impossible de charger ou créer les paramètres de notification.");
      }
    } catch (err: any) {
      console.error("Error fetching notification settings:", err);
      setErrorNotifSettings(`Erreur: ${err.message}`);
    } finally {
      setLoadingNotifSettings(false);
    }
  }, []);

  useEffect(() => {
    // Fetch only when the notifications tab is active or initially
    if (activeTab === 'notifications' && !notificationSettings && !loadingNotifSettings) {
       fetchNotificationSettings();
    }
  }, [activeTab, fetchNotificationSettings, notificationSettings, loadingNotifSettings]);

   // --- Save Local Interface Settings ---
   useEffect(() => {
       try {
           localStorage.setItem('orbitAppSettings', JSON.stringify(localSettings));
           // TODO: Apply theme change to body classlist or context
           // document.body.classList.toggle('dark', localSettings.theme === 'dark');
       } catch (e) {
           console.error("Failed to save settings to localStorage:", e);
       }
   }, [localSettings]);


  // --- Handlers for Notification Settings ---
  const handleToggleSetting = (field: keyof Pick<NotificationSettingsType, 'email_notifications' | 'browser_notifications' | 'sound_enabled'>) => {
    setNotificationSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: !prev[field]
      };
    });
    setSavedNotifSettings(false); // Reset saved state on change
  };

  const handleToggleNotificationType = (type: NotificationType) => {
    setNotificationSettings(prev => {
       if (!prev) return prev;
       const currentTypes = prev.notification_types || [];
       const newTypes = currentTypes.includes(type)
         ? currentTypes.filter(t => t !== type)
         : [...currentTypes, type];
       return { ...prev, notification_types: newTypes };
    });
     setSavedNotifSettings(false); // Reset saved state on change
  };

  const handleSaveNotificationSettings = async () => {
    if (!notificationSettings) return;
    setSavingNotifSettings(true);
    setErrorNotifSettings(null);
    setSavedNotifSettings(false);

    try {
      // Only send fields that are part of the Update type
       const updates: Partial<Database['public']['Tables']['notification_settings']['Update']> = {
           email_notifications: notificationSettings.email_notifications,
           browser_notifications: notificationSettings.browser_notifications,
           sound_enabled: notificationSettings.sound_enabled,
           notification_types: notificationSettings.notification_types
       };
      const success = await updateNotificationSettings(updates);
      if (!success) throw new Error("La mise à jour a échoué côté serveur.");

      setSavedNotifSettings(true);
      setTimeout(() => setSavedNotifSettings(false), 3000); // Hide message after delay
    } catch(err: any) {
        console.error("Error saving notification settings:", err);
        setErrorNotifSettings(`Erreur sauvegarde: ${err.message}`);
    } finally {
        setSavingNotifSettings(false);
    }
  };

  // --- Handlers for Interface Settings ---
   const handleLocalSettingChange = (key: keyof LocalSettings, value: any) => {
       setLocalSettings(prev => ({ ...prev, [key]: value }));
   };

   // --- Handlers for Security Settings ---
   const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordChangeError(null);
        setPasswordChangeSuccess(false);

        if (!authUser) {
            setPasswordChangeError("Utilisateur non authentifié.");
            return;
        }
        if (!newPassword || newPassword !== confirmPassword) {
            setPasswordChangeError("Les nouveaux mots de passe ne correspondent pas ou sont vides.");
            return;
        }
        if (newPassword.length < 6) { // Example minimum length
             setPasswordChangeError("Le nouveau mot de passe doit faire au moins 6 caractères.");
             return;
        }
        // IMPORTANT: Supabase's basic password update doesn't require the *current* password.
        // If you need that, you'd have to implement a custom flow (e.g., reauthenticate).
        // The `updateUser` function directly sets the new password.

        setPasswordChangeLoading(true);
        try {
             const { error: updateError } = await supabase.auth.updateUser({
                 password: newPassword
             });

             if (updateError) throw updateError;

             setPasswordChangeSuccess(true);
             // Clear fields on success
             setCurrentPassword('');
             setNewPassword('');
             setConfirmPassword('');
             setTimeout(() => setPasswordChangeSuccess(false), 4000); // Hide success message

        } catch (err: any) {
             console.error("Error changing password:", err);
             setPasswordChangeError(`Erreur: ${err.message || 'Impossible de changer le mot de passe.'}`);
        } finally {
            setPasswordChangeLoading(false);
        }
   };


  // --- Render ---
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Paramètres</h1>
        <p className="text-moon-gray">Gérez vos préférences et paramètres de compte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <nav className="space-y-1 sticky top-8"> {/* Added sticky positioning */}
            {/* Interface Tab Button */}
             <button
               className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'interface' ? 'bg-nebula-purple/15 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5 hover:text-star-white'}`}
               onClick={() => setActiveTab('interface')}
             >
                <Moon size={18} /> Interface
             </button>
            {/* Notifications Tab Button */}
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'notifications' ? 'bg-nebula-purple/15 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5 hover:text-star-white'}`}
              onClick={() => { setActiveTab('notifications'); if (!notificationSettings) fetchNotificationSettings(); }} // Fetch if not loaded
            >
               <Bell size={18} /> Notifications
            </button>
            {/* Security Tab Button */}
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-nebula-purple/15 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5 hover:text-star-white'}`}
              onClick={() => setActiveTab('security')}
            >
               <Shield size={18} /> Sécurité
            </button>
            {/* API Tab Button */}
             <button
               className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'api' ? 'bg-nebula-purple/15 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5 hover:text-star-white'}`}
               onClick={() => setActiveTab('api')}
             >
                <Key size={18} /> API
             </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 bg-deep-space rounded-xl border border-white/10 min-h-[400px]"> {/* Added min-h */}
          {/* Interface Settings Tab */}
          {activeTab === 'interface' && (
            <div className="p-6">
              <h2 className="text-xl font-orbitron text-star-white mb-6 border-b border-white/10 pb-4">Interface</h2>
              <div className="space-y-6">
                  {/* Theme Selector */}
                   <div className="flex justify-between items-center">
                      <label htmlFor="themeSelect" className="flex items-center gap-3">
                        <Moon size={16} className="text-moon-gray" />
                        <div>
                            <span className="font-medium text-star-white">Thème</span>
                            <p className="text-sm text-moon-gray">Apparence visuelle</p>
                        </div>
                      </label>
                      <select
                        id="themeSelect"
                        value={localSettings.theme}
                        onChange={(e) => handleLocalSettingChange('theme', e.target.value as LocalSettings['theme'])}
                        className="bg-space-black border border-white/10 rounded-lg px-3 py-1.5 text-star-white focus:outline-none focus:border-nebula-purple text-sm"
                      >
                         <option value="dark">Dark (Spatial)</option>
                         <option value="light">Light (Non implémenté)</option>
                         <option value="system">Système (Non implémenté)</option>
                      </select>
                   </div>
                   {/* Sound Toggle */}
                    <div className="flex justify-between items-center">
                      <label htmlFor="soundToggle" className="flex items-center gap-3 cursor-pointer">
                        <Volume2 size={16} className="text-moon-gray" />
                        <div>
                           <span className="font-medium text-star-white">Effets sonores</span>
                           <p className="text-sm text-moon-gray">Activer les sons d'interface</p>
                        </div>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                         <input id="soundToggle" type="checkbox" checked={localSettings.soundEffects} onChange={(e) => handleLocalSettingChange('soundEffects', e.target.checked)} className="sr-only peer" />
                         <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                       </label>
                    </div>
                   {/* Animations Toggle */}
                    <div className="flex justify-between items-center">
                      <label htmlFor="animToggle" className="flex items-center gap-3 cursor-pointer">
                        <Bell size={16} className="text-moon-gray transform motion-safe:group-hover:animate-swing" /> {/* Example subtle anim */}
                         <div>
                            <span className="font-medium text-star-white">Animations</span>
                            <p className="text-sm text-moon-gray">Activer les transitions</p>
                         </div>
                      </label>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input id="animToggle" type="checkbox" checked={localSettings.animations} onChange={(e) => handleLocalSettingChange('animations', e.target.checked)} className="sr-only peer" />
                         <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                       </label>
                    </div>
                   {/* Language Selector */}
                    <div className="flex justify-between items-center">
                      <label htmlFor="langSelect" className="flex items-center gap-3">
                        <Globe size={16} className="text-moon-gray" />
                         <div>
                           <span className="font-medium text-star-white">Langue</span>
                           <p className="text-sm text-moon-gray">Langue de l'interface</p>
                         </div>
                      </label>
                       <select
                        id="langSelect"
                        value={localSettings.language}
                        onChange={(e) => handleLocalSettingChange('language', e.target.value as LocalSettings['language'])}
                        className="bg-space-black border border-white/10 rounded-lg px-3 py-1.5 text-star-white focus:outline-none focus:border-nebula-purple text-sm"
                      >
                         <option value="fr">Français</option>
                         <option value="en">English (Non implémenté)</option>
                         <option value="es">Español (Non implémenté)</option>
                       </select>
                    </div>

                    <p className="text-xs text-moon-gray pt-4 border-t border-white/5">
                      Note: La plupart des paramètres d'interface sont stockés localement et leur application visuelle (thème, langue) nécessite une implémentation supplémentaire.
                    </p>
              </div>
            </div>
          )}

          {/* Notifications Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6">
               <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                 <h2 className="text-xl font-orbitron text-star-white">Notifications</h2>
                 {savedNotifSettings && (
                     <span className="text-sm text-green-success flex items-center gap-1">
                       <CheckCircle size={16}/> Enregistré!
                     </span>
                 )}
               </div>

              {loadingNotifSettings ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
                </div>
              ) : errorNotifSettings ? (
                  <div className="p-4 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-3">
                       <AlertCircle size={20} />
                       <span>{errorNotifSettings}</span>
                  </div>
              ) : notificationSettings ? (
                <div className="space-y-6">
                  {/* Browser Notifications Toggle */}
                   <div className="flex justify-between items-center">
                     <label htmlFor="browserNotif" className="flex items-center gap-3 cursor-pointer">
                        <Bell size={16} className="text-moon-gray" />
                        <div>
                           <span className="font-medium text-star-white">Notifications navigateur</span>
                           <p className="text-sm text-moon-gray">Recevoir dans l'application</p>
                        </div>
                     </label>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input id="browserNotif" type="checkbox" className="sr-only peer" checked={notificationSettings.browser_notifications} onChange={() => handleToggleSetting('browser_notifications')} />
                       <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                     </label>
                   </div>

                  {/* Email Notifications Toggle */}
                    <div className="flex justify-between items-center">
                     <label htmlFor="emailNotif" className="flex items-center gap-3 cursor-pointer">
                       <Mail size={16} className="text-moon-gray" />
                       <div>
                           <span className="font-medium text-star-white">Notifications par email</span>
                           <p className="text-sm text-moon-gray">Recevoir par courriel</p>
                       </div>
                     </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input id="emailNotif" type="checkbox" className="sr-only peer" checked={notificationSettings.email_notifications} onChange={() => handleToggleSetting('email_notifications')} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                      </label>
                    </div>

                  {/* Sound Toggle */}
                    <div className="flex justify-between items-center">
                      <label htmlFor="soundNotif" className="flex items-center gap-3 cursor-pointer">
                        <Volume2 size={16} className="text-moon-gray" />
                        <div>
                           <span className="font-medium text-star-white">Sons de notification</span>
                           <p className="text-sm text-moon-gray">Activer les sons d'alerte</p>
                        </div>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                         <input id="soundNotif" type="checkbox" className="sr-only peer" checked={notificationSettings.sound_enabled} onChange={() => handleToggleSetting('sound_enabled')} />
                         <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                       </label>
                    </div>

                  {/* Notification Types Checkboxes */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="font-medium text-star-white mb-3">Types de notifications à recevoir</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                       {(['ticket_assigned', 'deadline_approaching', 'mention', 'ticket_updated', 'project_created', 'project_updated'] as NotificationType[]).map(type => {
                           // Simple labels for types
                           const labels: Record<NotificationType, string> = {
                               'ticket_assigned': 'Tâches assignées',
                               'deadline_approaching': 'Deadlines proches',
                               'mention': 'Mentions',
                               'ticket_updated': 'MàJ Tâches',
                               'project_created': 'Nouveaux projets',
                               'project_updated': 'MàJ Projets',
                           };
                           return (
                               <div key={type} className="flex items-center">
                                 <input
                                   type="checkbox"
                                   id={`notif-${type}`}
                                   className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded focus:ring-nebula-purple focus:ring-offset-deep-space"
                                   checked={notificationSettings.notification_types?.includes(type) ?? false} // Handle null array
                                   onChange={() => handleToggleNotificationType(type)}
                                 />
                                 <label htmlFor={`notif-${type}`} className="ml-2 text-sm text-star-white cursor-pointer select-none">
                                     {labels[type]}
                                 </label>
                               </div>
                           );
                       })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-6 border-t border-white/10 flex justify-end">
                    <Button
                      variant={savedNotifSettings ? "success" : "primary"}
                      onClick={handleSaveNotificationSettings}
                      disabled={savingNotifSettings || loadingNotifSettings}
                       iconLeft={savedNotifSettings ? <CheckCircle size={16}/> : savingNotifSettings ? null : <Save size={16}/>}
                    >
                      {savingNotifSettings ? 'Enregistrement...' : savedNotifSettings ? 'Enregistré' : 'Enregistrer les préférences'}
                    </Button>
                  </div>
                </div>
              ) : null } {/* End of conditional rendering for notification settings */}
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChangeSubmit} className="p-6">
              <h2 className="text-xl font-orbitron text-star-white mb-6 border-b border-white/10 pb-4">Sécurité du compte</h2>

              {passwordChangeError && (
                <div className="mb-4 p-3 bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg flex items-center gap-2">
                   <AlertCircle size={18} /> <span>{passwordChangeError}</span>
                </div>
              )}
              {passwordChangeSuccess && (
                 <div className="mb-4 p-3 bg-green-success/10 text-green-success border border-green-success/20 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} /> <span>Mot de passe changé avec succès!</span>
                 </div>
              )}

              <div className="space-y-4">
                 {/* Current Password (Optional - Supabase doesn't require it for basic update) */}
                 {/*
                 <div>
                   <label className="block text-sm text-moon-gray mb-1.5" htmlFor="currentPassword">Mot de passe actuel</label>
                   <input
                     id="currentPassword"
                     type="password"
                     value={currentPassword}
                     onChange={(e) => setCurrentPassword(e.target.value)}
                     className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple"
                     placeholder="Requis pour certaines opérations"
                     disabled={passwordChangeLoading}
                   />
                 </div>
                 */}

                 <div>
                   <label className="block text-sm text-moon-gray mb-1.5" htmlFor="newPassword">Nouveau mot de passe</label>
                   <input
                     id="newPassword"
                     type="password"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple"
                     placeholder="•••••••• (min. 6 caractères)"
                     required
                     minLength={6}
                     disabled={passwordChangeLoading}
                   />
                 </div>

                 <div>
                   <label className="block text-sm text-moon-gray mb-1.5" htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                   <input
                     id="confirmPassword"
                     type="password"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className={`w-full bg-space-black border rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:border-nebula-purple ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-alert' : 'border-white/10'}`}
                     placeholder="••••••••"
                     required
                     minLength={6}
                     disabled={passwordChangeLoading}
                   />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-alert mt-1">Les mots de passe ne correspondent pas.</p>
                    )}
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                <Button
                    variant="primary"
                    type="submit"
                    disabled={passwordChangeLoading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {passwordChangeLoading ? 'Modification...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          )}

          {/* API Settings Tab (Placeholder) */}
          {activeTab === 'api' && (
            <div className="p-6">
              <h2 className="text-xl font-orbitron text-star-white mb-6 border-b border-white/10 pb-4">Clés API</h2>
              <div className="bg-space-black/50 p-4 rounded-lg border border-white/10 mb-6">
                 <div className="flex items-center gap-2 mb-3">
                   <Key size={16} className="text-moon-gray" />
                   <h4 className="text-sm text-moon-gray">Votre Clé API Personnelle (Exemple)</h4>
                 </div>
                 <div className="flex">
                   <input
                     type="text"
                     value="pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Placeholder - DO NOT HARDCODE REAL KEYS
                     readOnly
                     className="w-full bg-space-black border border-white/10 rounded-l-lg px-4 py-2 text-star-white focus:outline-none select-all font-mono text-xs"
                   />
                   <button
                       onClick={() => navigator.clipboard.writeText('pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx')}
                       className="bg-nebula-purple hover:bg-nebula-purple-light text-star-white px-3 py-2 rounded-r-lg text-sm transition-colors"
                       title="Copier la clé"
                   >
                     Copier
                   </button>
                 </div>
                 <p className="text-xs text-moon-gray mt-2">
                    Utilisez cette clé pour interagir avec l'API Orbit (si disponible). Ne la partagez pas.
                 </p>
               </div>

               <div className="flex justify-start gap-3"> {/* Changed to justify-start */}
                 {/* <Button variant="outline">Régénérer la clé</Button> */}
                 {/* <Button variant="primary">Documentation API</Button> */}
                 <p className="text-sm text-moon-gray">Fonctionnalités API non implémentées.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;