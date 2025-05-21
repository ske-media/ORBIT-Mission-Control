import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-space-black text-star-white">
      <Sidebar />
      <main className="flex-1 pl-20 flex flex-col overflow-hidden"> {/* Important ici */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;