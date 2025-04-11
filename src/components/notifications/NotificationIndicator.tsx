import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationsCount } from '../../lib/supabase';

const NotificationIndicator: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    };
    
    fetchUnreadCount();
    
    // Refetch every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative">
      <Bell size={24} />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-alert flex items-center justify-center text-star-white text-xs font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationIndicator;