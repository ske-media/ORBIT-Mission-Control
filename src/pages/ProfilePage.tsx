import React from 'react';
import { Edit, Mail, Shield, Calendar, Activity } from 'lucide-react';
import { getCurrentUser } from '../data/mockData';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

const ProfilePage: React.FC = () => {
  const currentUser = getCurrentUser();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <Avatar 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              size="lg" 
              className="w-28 h-28" 
            />
            <button className="absolute bottom-0 right-0 bg-nebula-purple rounded-full p-2 border-2 border-deep-space">
              <Edit size={14} className="text-star-white" />
            </button>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-orbitron text-star-white mb-2">{currentUser.name}</h1>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <Mail size={16} className="text-moon-gray" />
              <span className="text-moon-gray">{currentUser.email}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-nebula-purple/20 text-nebula-purple px-3 py-1 rounded-full flex items-center gap-1">
                <Shield size={14} />
                <span>{currentUser.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</span>
              </div>
              <div className="bg-green-success/20 text-green-success px-3 py-1 rounded-full">
                Actif
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-nebula-purple/20 flex items-center justify-center">
              <Activity size={20} className="text-nebula-purple" />
            </div>
            <div>
              <p className="text-moon-gray">Tickets assignés</p>
              <h3 className="text-2xl font-orbitron text-star-white">12</h3>
            </div>
          </div>
          
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-success/20 flex items-center justify-center">
              <Shield size={20} className="text-green-success" />
            </div>
            <div>
              <p className="text-moon-gray">Tickets complétés</p>
              <h3 className="text-2xl font-orbitron text-star-white">42</h3>
            </div>
          </div>
          
          <div className="bg-deep-space rounded-xl p-6 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-warning/20 flex items-center justify-center">
              <Calendar size={20} className="text-yellow-warning" />
            </div>
            <div>
              <p className="text-moon-gray">Date d'inscription</p>
              <h3 className="text-2xl font-orbitron text-star-white">6 mois</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-deep-space rounded-xl border border-white/10 mb-10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-orbitron text-star-white">Informations personnelles</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-moon-gray mb-2">Nom complet</label>
                <input 
                  type="text" 
                  value={currentUser.name} 
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>
              
              <div>
                <label className="block text-sm text-moon-gray mb-2">Email</label>
                <input 
                  type="email" 
                  value={currentUser.email} 
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>
              
              <div>
                <label className="block text-sm text-moon-gray mb-2">Poste</label>
                <input 
                  type="text" 
                  value="Directrice créative" 
                  className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple"
                />
              </div>
              
              <div>
                <label className="block text-sm text-moon-gray mb-2">Fuseau horaire</label>
                <select className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-3 text-star-white focus:outline-none focus:border-nebula-purple">
                  <option>Europe/Paris (UTC+01:00)</option>
                  <option>America/New_York (UTC-05:00)</option>
                  <option>Asia/Tokyo (UTC+09:00)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="primary">Enregistrer</Button>
            </div>
          </div>
        </div>
        
        <div className="bg-deep-space rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-orbitron text-star-white">Sécurité du compte</h2>
          </div>
          
          <div className="p-6">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;