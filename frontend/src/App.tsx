import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SchedulersListPage } from './pages/schedulers/SchedulersListPage';
import { SchedulerFormPage } from './pages/schedulers/SchedulerFormPage';
import { ExcelImportExportPage } from './pages/excel/ExcelImportExportPage';
import { SystemHealthPage } from './pages/health/SystemHealthPage';
import { ExecutionHistoryPage } from './pages/history/ExecutionHistoryPage';
import { UsersRolesPage } from './pages/users/UsersRolesPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="schedulers" element={<SchedulersListPage />} />
            <Route path="schedulers/new" element={<SchedulerFormPage />} />
            <Route path="schedulers/edit/:id" element={<SchedulerFormPage />} />
            <Route path="history" element={<ExecutionHistoryPage />} />
            <Route path="excel" element={<ExcelImportExportPage />} />
            <Route path="health" element={<SystemHealthPage />} />
            <Route path="users-roles" element={<UsersRolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
