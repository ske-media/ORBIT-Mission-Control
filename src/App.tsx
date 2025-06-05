import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ClientPage from '@/pages/ClientPage';
import SettingsPage from '@/pages/SettingsPage';
import OrganizationDetailsPage from '@/pages/OrganizationDetailsPage';
import ContactDetailsPage from '@/pages/ContactDetailsPage';
import { AuthProvider } from '@/contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/clients/organizations/:id" element={<OrganizationDetailsPage />} />
            <Route path="/clients/contacts/:id" element={<ContactDetailsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
