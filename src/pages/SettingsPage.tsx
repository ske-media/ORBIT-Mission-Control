import React, { useState, useEffect } from 'react';
import { Bell, Moon, Volume2, Globe, Shield, Key, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import { getNotificationSettings, updateNotificationSettings } from '../lib/supabase';
import { Database } from '../types/supabase';

type NotificationSettingsType = Database['public']['Tables']['notification_settings']['Row'];
type NotificationType = 'ticket_assigned' | 'ticket_updated' | 'project_created' | 'project_updated' | 'deadline_approaching' | 'mention';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interface' | 'notifications' | 'security' | 'api'>('interface');
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleToggleSetting = (field: keyof NotificationSettingsType) => {
    if (!settings || typeof settings[field] !== 'boolean') return;
    
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: !prev[field]
      };
    });
  };

  const handleToggleNotificationType = (type: NotificationType) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      
      const currentTypes = prev.notification_types || [];
      let newTypes;
      
      if (currentTypes.includes(type)) {
        newTypes = currentTypes.filter(t => t !== type);
      } else {
        newTypes = [...currentTypes, type];
      }
      
      return {
        ...prev,
        notification_types: newTypes
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    
    await updateNotificationSettings({
      email_notifications: settings.email_notifications,
      browser_notifications: settings.browser_notifications,
      sound_enabled: settings.sound_enabled,
      notification_types: settings.notification_types
    });
    
    setSaving(false);
    setSaved(true);
    
    // Reset saved state after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Paramètres</h1>
        <p className="text-moon-gray">Gérez vos préférences et paramètres de compte</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <button 
              className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'interface' ? 'bg-nebula-purple/20 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5'}`}
              onClick={() => setActiveTab('interface')}
            >
              Interface
            </button>
            <button 
              className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'notifications' ? 'bg-nebula-purple/20 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5'}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button 
              className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'security' ? 'bg-nebula-purple/20 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5'}`}
              onClick={() => setActiveTab('security')}
            >
              Sécurité
            </button>
            <button 
              className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'api' ? 'bg-nebula-purple/20 text-nebula-purple font-medium' : 'text-moon-gray hover:bg-white/5'}`}
              onClick={() => setActiveTab('api')}
            >
              API
            </button>
          </nav>
        </div>
        
        <div className="md:col-span-2 bg-deep-space rounded-xl p-6 border border-white/10">
          {activeTab === 'interface' && (
            <>
              <h2 className="text-xl font-orbitron text-star-white mb-4">Interface</h2>
              
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                        <Moon size={16} className="text-nebula-purple" />
                      </div>
                      <div>
                        <h3 className="font-medium text-star-white">Thème</h3>
                        <p className="text-sm text-moon-gray">Choisissez le thème de l'interface</p>
                      </div>
                    </div>
                    <select className="bg-space-black border border-white/10 rounded-lg px-3 py-2 text-star-white focus:outline-none focus:border-nebula-purple">
                      <option value="dark">Dark (Spatial)</option>
                      <option value="light">Light</option>
                      <option value="system">Système</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-b border-white/10 pb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                        <Volume2 size={16} className="text-nebula-purple" />
                      </div>
                      <div>
                        <h3 className="font-medium text-star-white">Son</h3>
                        <p className="text-sm text-moon-gray">Activer les effets sonores</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                    </label>
                  </div>
                </div>
                
                <div className="border-b border-white/10 pb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                        <Bell size={16} className="text-nebula-purple" />
                      </div>
                      <div>
                        <h3 className="font-medium text-star-white">Animations</h3>
                        <p className="text-sm text-moon-gray">Activer les animations de l'interface</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                    </label>
                  </div>
                </div>
                
                <div className="border-b border-white/10 pb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                        <Globe size={16} className="text-nebula-purple" />
                      </div>
                      <div>
                        <h3 className="font-medium text-star-white">Langue</h3>
                        <p className="text-sm text-moon-gray">Choisissez la langue de l'interface</p>
                      </div>
                    </div>
                    <select className="bg-space-black border border-white/10 rounded-lg px-3 py-2 text-star-white focus:outline-none focus:border-nebula-purple">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="primary">Enregistrer</Button>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'notifications' && (
            <>
              <h2 className="text-xl font-orbitron text-star-white mb-4">Notifications</h2>
              
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                          <Bell size={16} className="text-nebula-purple" />
                        </div>
                        <div>
                          <h3 className="font-medium text-star-white">Notifications navigateur</h3>
                          <p className="text-sm text-moon-gray">Recevoir des notifications dans l'application</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings?.browser_notifications ?? true}
                          onChange={() => handleToggleSetting('browser_notifications')}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-b border-white/10 pb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-galaxy-blue/20 flex items-center justify-center">
                          <Mail size={16} className="text-galaxy-blue" />
                        </div>
                        <div>
                          <h3 className="font-medium text-star-white">Notifications par email</h3>
                          <p className="text-sm text-moon-gray">Recevoir des notifications par email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings?.email_notifications ?? true}
                          onChange={() => handleToggleSetting('email_notifications')}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-b border-white/10 pb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                          <Volume2 size={16} className="text-nebula-purple" />
                        </div>
                        <div>
                          <h3 className="font-medium text-star-white">Sons de notification</h3>
                          <p className="text-sm text-moon-gray">Activer les sons lors des notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings?.sound_enabled ?? true}
                          onChange={() => handleToggleSetting('sound_enabled')}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nebula-purple"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-b border-white/10 pb-6">
                    <div className="mb-3">
                      <h3 className="font-medium text-star-white mb-1">Types de notifications</h3>
                      <p className="text-sm text-moon-gray">Choisissez quelles notifications vous souhaitez recevoir</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-assigned" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('ticket_assigned') ?? true}
                          onChange={() => handleToggleNotificationType('ticket_assigned')}
                        />
                        <label htmlFor="notif-assigned" className="ml-2 text-sm text-star-white">Tâches assignées</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-deadline" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('deadline_approaching') ?? true}
                          onChange={() => handleToggleNotificationType('deadline_approaching')}
                        />
                        <label htmlFor="notif-deadline" className="ml-2 text-sm text-star-white">Deadlines proches</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-mention" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('mention') ?? true}
                          onChange={() => handleToggleNotificationType('mention')}
                        />
                        <label htmlFor="notif-mention" className="ml-2 text-sm text-star-white">Mentions</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-updated" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('ticket_updated') ?? false}
                          onChange={() => handleToggleNotificationType('ticket_updated')}
                        />
                        <label htmlFor="notif-updated" className="ml-2 text-sm text-star-white">Mises à jour de tâches</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-project-created" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('project_created') ?? false}
                          onChange={() => handleToggleNotificationType('project_created')}
                        />
                        <label htmlFor="notif-project-created" className="ml-2 text-sm text-star-white">Nouveaux projets</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notif-project-updated" 
                          className="w-4 h-4 accent-nebula-purple bg-space-black border-white/30 rounded"
                          checked={settings?.notification_types?.includes('project_updated') ?? false}
                          onChange={() => handleToggleNotificationType('project_updated')}
                        />
                        <label htmlFor="notif-project-updated" className="ml-2 text-sm text-star-white">Mises à jour de projets</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant={saved ? "success" : "primary"}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Enregistrement...' : saved ? 'Enregistré ✓' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'security' && (
            <>
              <h2 className="text-xl font-orbitron text-star-white mb-4">Sécurité du compte</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-moon-gray mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  value="••••••••"
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline">Changer le mot de passe</Button>
              </div>
            </>
          )}
          
          {activeTab === 'api' && (
            <>
              <h2 className="text-xl font-orbitron text-star-white mb-4">API</h2>
              
              <div className="bg-space-black/50 p-4 rounded-lg border border-white/10 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Key size={16} className="text-moon-gray" />
                  <h4 className="text-sm text-moon-gray">Clé API</h4>
                </div>
                <div className="flex">
                  <input 
                    type="text" 
                    value="sk_orbit_1234567890abcdefghijklmnopqrstuv" 
                    readOnly
                    className="w-full bg-space-black border border-white/10 rounded-l-lg px-4 py-3 text-star-white focus:outline-none"
                  />
                  <button className="bg-nebula-purple text-star-white px-4 py-2 rounded-r-lg">
                    Copier
                  </button>
                </div>
                <p className="text-xs text-moon-gray mt-2">
                  Ne partagez jamais votre clé API. Vous pouvez la régénérer à tout moment.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline">Régénérer</Button>
                <Button variant="primary">Documentation API</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;