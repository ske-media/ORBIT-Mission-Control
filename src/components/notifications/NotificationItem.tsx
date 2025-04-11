import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  Rocket, 
  Bell
} from 'lucide-react';
import { Database } from '../../types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  let Icon = Bell;
  let bgColor = 'bg-nebula-purple/20';
  let iconColor = 'text-nebula-purple';
  
  // Determine icon based on notification type
  switch (notification.type) {
    case 'ticket_assigned':
      Icon = UserCheck;
      break;
    case 'deadline_approaching':
      Icon = Calendar;
      bgColor = 'bg-yellow-warning/20';
      iconColor = 'text-yellow-warning';
      break;
    case 'mention':
      Icon = MessageSquare;
      bgColor = 'bg-galaxy-blue/20';
      iconColor = 'text-galaxy-blue';
      break;
    case 'project_created':
    case 'project_updated':
      Icon = Rocket;
      break;
  }
  
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true,
    locale: fr
  });
  
  return (
    <div 
      className={`
        p-4 border-b border-white/10 
        flex items-start gap-3 transition-colors
        ${notification.is_read ? 'bg-deep-space' : 'bg-space-black/80'}
      `}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm mb-1 ${notification.is_read ? 'text-moon-gray' : 'text-star-white'}`}>
          {notification.content}
        </p>
        <p className="text-xs text-moon-gray">{timeAgo}</p>
      </div>
      
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-nebula-purple flex-shrink-0"></div>
      )}
    </div>
  );
};

export default NotificationItem;