import React from 'react';
import { Bell } from 'lucide-react';

const EmptyNotifications: React.FC = () => {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-deep-space flex items-center justify-center mb-4">
        <Bell size={24} className="text-moon-gray" />
      </div>
      <h3 className="text-lg font-medium text-star-white mb-2">Pas de notifications</h3>
      <p className="text-sm text-moon-gray max-w-md">
        Vous serez notifié lorsque vous serez assigné à une tâche, mentionné dans un commentaire, ou lorsqu'une deadline approchera.
      </p>
    </div>
  );
};

export default EmptyNotifications;