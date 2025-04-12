import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, MessageSquare, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { getCurrentUserProfile, getInboxItems, createInboxItem, getUserById, getProjectById } from '../lib/supabase';
import { Database } from '../types/supabase';

type InboxItem = Database['public']['Tables']['inbox_items']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

const InboxPage: React.FC = () => {
  const [newMessage, setNewMessage] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch current user
        const user = await getCurrentUserProfile();
        setCurrentUser(user);
        
        // Fetch inbox items
        const items = await getInboxItems();
        setInboxItems(items);
        
        // Get unique user IDs and project IDs from inbox items
        const userIds = new Set<string>();
        const projectIds = new Set<string>();
        
        items.forEach(item => {
          if (item.created_by) userIds.add(item.created_by);
          if (item.project_id) projectIds.add(item.project_id);
        });
        
        // Fetch user data
        const userPromises = Array.from(userIds).map(async id => {
          const user = await getUserById(id);
          if (user) return { id, user };
          return null;
        });
        
        // Fetch project data
        const projectPromises = Array.from(projectIds).map(async id => {
          const project = await getProjectById(id);
          if (project) return { id, project };
          return null;
        });
        
        // Wait for all promises to resolve
        const userResults = await Promise.all(userPromises);
        const projectResults = await Promise.all(projectPromises);
        
        // Build lookup objects
        const userLookup: Record<string, User> = {};
        const projectLookup: Record<string, Project> = {};
        
        userResults.forEach(result => {
          if (result) userLookup[result.id] = result.user;
        });
        
        projectResults.forEach(result => {
          if (result) projectLookup[result.id] = result.project;
        });
        
        setUsers(userLookup);
        setProjects(projectLookup);
      } catch (error) {
        console.error('Error fetching inbox data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return new Intl.DateTimeFormat('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(date);
    }
    
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    }).format(date);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;
    
    try {
      const newItem = await createInboxItem({
        content: newMessage,
        created_by: currentUser.id
      });
      
      if (newItem) {
        setInboxItems([newItem, ...inboxItems]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error creating inbox item:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Inbox</h1>
        <p className="text-moon-gray">Idées, demandes, et notes à trier plus tard</p>
      </div>
      
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="bg-deep-space rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3 mb-3">
            <Avatar 
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
              alt={currentUser?.name || 'Utilisateur'} 
              size="md" 
            />
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Notez une idée, demande ou question..."
                className="w-full bg-space-black min-h-[100px] rounded-lg p-3 text-star-white placeholder:text-moon-gray focus:outline-none focus:ring-1 focus:ring-nebula-purple border border-white/10"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant="primary" 
              iconRight={<Send size={16} />}
              disabled={!newMessage.trim()}
            >
              Envoyer
            </Button>
          </div>
        </form>
      </div>
      
      <div className="space-y-4">
        {inboxItems.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="bg-deep-space rounded-xl p-4 border border-white/10 relative group"
          >
            <div className="flex items-start gap-3">
              <Avatar 
                src={users[item.created_by]?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                alt={users[item.created_by]?.name || 'User'} 
                size="md" 
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-star-white">
                    {users[item.created_by]?.name || 'Utilisateur'}
                  </h3>
                  <span className="text-xs text-moon-gray">{formatDate(item.created_at)}</span>
                </div>
                <p className="text-star-white mb-3">{item.content}</p>
                
                {item.project_id && projects[item.project_id] && (
                  <div className="flex items-center">
                    <span className="bg-nebula-purple/20 text-nebula-purple text-xs px-2 py-1 rounded-full">
                      {projects[item.project_id].name || 'Projet'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 bg-white/10 rounded-full hover:bg-white/20 text-moon-gray">
                <X size={14} />
              </button>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                iconLeft={<MessageSquare size={14} />}
              >
                Commenter
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                iconLeft={<Plus size={14} />}
              >
                Créer une tâche
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InboxPage;