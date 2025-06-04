import React from 'react';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-star-white mb-8">Notifications</h1>
      <div className="bg-deep-space border border-nebula-purple rounded-lg p-6">
        <p className="text-moon-gray">Aucune notification pour le moment.</p>
      </div>
    </div>
  );
} 