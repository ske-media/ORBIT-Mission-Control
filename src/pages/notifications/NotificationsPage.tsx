import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../lib/supabase';
import { Database } from '../../types/supabase';
import NotificationItem from '../../components/notifications/NotificationItem';
import EmptyNotifications from '../../components/notifications/EmptyNotifications';
import Button from '../../components/ui/Button';

type Notification = Database['public']['Tables']['notifications']['Row'];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    const data = await getNotifications(30); // Get up to 30 notifications
    setNotifications(data);
    setLoading(false);
  };
  
  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
  };
  
  const hasUnreadNotifications = notifications.some(n => !n.is_read);
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Notifications</h1>
          <p className="text-moon-gray">Restez informé des mises à jour de vos projets et tâches</p>
        </div>
        
        {hasUnreadNotifications && (
          <Button 
            variant="outline" 
            size="sm"
            iconLeft={<Check size={16} />}
            onClick={handleMarkAllAsRead}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>
      
      <div className="bg-deep-space rounded-xl overflow-hidden border border-white/10">
        {notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;