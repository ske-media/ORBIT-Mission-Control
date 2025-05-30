import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Rocket, 
  Inbox, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  User,
  Bell,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import NotificationIndicator from '../notifications/NotificationIndicator';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1);
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setUserProfile(data[0]);
      } else {
        setUserProfile(null); // Handle the case where no user is found
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const navItems = [
    { 
      path: '/dashboard', 
      icon: <LayoutDashboard size={24} />, 
      label: 'Tableau de bord',
      activePattern: /^\/dashboard/ 
    },
    { 
      path: '/projects', 
      icon: <Rocket size={24} />, 
      label: 'Projets',
      activePattern: /^\/projects/ 
    },
    { 
      path: '/clients', 
      icon: <Users size={24} />, 
      label: 'Clients',
      activePattern: /^\/clients/ 
    },
    { 
      path: '/inbox', 
      icon: <Inbox size={24} />, 
      label: 'Inbox',
      activePattern: /^\/inbox/ 
    },
    { 
      path: '/notifications', 
      icon: <NotificationIndicator />, 
      label: 'Notifications',
      activePattern: /^\/notifications/ 
    },
    { 
      path: '/profile', 
      icon: <User size={24} />, 
      label: 'Profil',
      activePattern: /^\/profile/ 
    },
    { 
      path: '/settings', 
      icon: <Settings size={24} />, 
      label: 'Paramètres',
      activePattern: /^\/settings/ 
    },
  ];

  const isActive = (pattern: RegExp) => pattern.test(location.pathname);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-deep-space flex flex-col items-center py-8 border-r border-white/10">
      <div className="mb-10">
        <div className="w-12 h-12 rounded-full bg-nebula-purple flex items-center justify-center">
          <Rocket className="text-star-white" size={24} />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col items-center gap-8">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center group`}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-300 ease-in-out
              ${isActive(item.activePattern) 
                ? 'bg-nebula-purple text-star-white shadow-neon' 
                : 'text-moon-gray hover:text-star-white'}
            `}>
              {item.icon}
            </div>
            <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-deep-space text-star-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
            {isActive(item.activePattern) && (
              <div className="absolute w-1 h-8 bg-nebula-purple rounded-r-full -left-4"></div>
            )}
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-nebula-purple">
          <img 
            src={userProfile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
            alt={userProfile?.name || 'Utilisateur'} 
            className="w-full h-full object-cover"
          />
        </div>
        <button 
          className="w-10 h-10 flex items-center justify-center text-moon-gray hover:text-red-alert transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;