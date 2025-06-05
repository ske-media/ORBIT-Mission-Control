import React, { useState } from 'react';
import { Bell, Moon, Volume2, Globe, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface LocalSettings {
  theme: 'dark' | 'light' | 'system';
  soundEffects: boolean;
  animations: boolean;
  language: 'fr' | 'en' | 'es';
}

const SettingsPage: React.FC = () => {
  const [localSettings, setLocalSettings] = useState<LocalSettings>(() => {
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
           // Profile was not found or could not be created
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Paramètres</h1>
        <p className="text-moon-gray">Configurez votre espace de travail</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Interface</h2>
          <div className="space-y-4">
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

            <div className="flex justify-between items-center">
              <label htmlFor="soundToggle" className="flex items-center gap-3 cursor-pointer">
                <Volume2 size={16} className="text-moon-gray" />
                <div>
                  <span className="font-medium text-star-white">Effets sonores</span>
                  <p className="text-sm text-moon-gray">Activer les sons d'interface</p>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="soundToggle"
                  type="checkbox"
                  checked={localSettings.soundEffects}
                  onChange={(e) => handleLocalSettingChange('soundEffects', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <label htmlFor="animToggle" className="flex items-center gap-3 cursor-pointer">
                <Bell size={16} className="text-moon-gray" />
                <div>
                  <span className="font-medium text-star-white">Animations</span>
                  <p className="text-sm text-moon-gray">Activer les transitions</p>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="animToggle"
                  type="checkbox"
                  checked={localSettings.animations}
                  onChange={(e) => handleLocalSettingChange('animations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
              </label>
            </div>

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
          </div>
        </div>

        <div className="bg-deep-space rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-orbitron text-star-white mb-4">Sécurité</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-moon-gray" />
              <div>
                <span className="font-medium text-star-white">Authentification à deux facteurs</span>
                <p className="text-sm text-moon-gray">Non implémenté</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;