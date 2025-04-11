import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, MessageSquare, X } from 'lucide-react';
import { getCurrentUser, inboxItems, getProjectById, getUserById } from '../data/mockData';
import { InboxItem } from '../types';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const InboxPage: React.FC = () => {
  const [newMessage, setNewMessage] = useState('');
  const currentUser = getCurrentUser();
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the database
    console.log('New message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron text-star-white mb-2">Inbox</h1>
        <p className="text-moon-gray">Idées, demandes, et notes à trier plus tard</p>
      </div>
      
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="bg-deep-space rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3 mb-3">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />
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
                src={getUserById(item.createdBy)?.avatar || ''} 
                alt={getUserById(item.createdBy)?.name || 'User'} 
                size="md" 
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-star-white">
                    {getUserById(item.createdBy)?.name || 'User'}
                  </h3>
                  <span className="text-xs text-moon-gray">{formatDate(item.createdAt)}</span>
                </div>
                <p className="text-star-white mb-3">{item.content}</p>
                
                {item.projectId && (
                  <div className="flex items-center">
                    <span className="bg-nebula-purple/20 text-nebula-purple text-xs px-2 py-1 rounded-full">
                      {getProjectById(item.projectId)?.name || 'Project'}
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