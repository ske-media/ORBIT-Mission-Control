import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';

export function Layout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
} 