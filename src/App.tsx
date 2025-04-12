import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import InboxPage from './pages/InboxPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import { useInitializeApp } from './hooks/useInitializeApp';

function App() {
  const { initializing } = useInitializeApp();
  
  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-space-black">
        <div className="w-16 h-16 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin mb-4"></div>
        <h2 className="text-star-white text-xl font-orbitron">Initialization en cours...</h2>
        <p className="text-moon-gray mt-2">Préparation de l'environnement</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;