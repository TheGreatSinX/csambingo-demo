import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PlayerGamePage } from './pages/PlayerGamePage';
import { HostGamePage } from './pages/HostGamePage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMfaPage } from './pages/admin/AdminMfaPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminGamesPage } from './pages/admin/AdminGamesPage';
import { AdminGameBuilderPage } from './pages/admin/AdminGameBuilderPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminPatternsPage } from './pages/admin/AdminPatternsPage';
import { AdminThemesPage } from './pages/admin/AdminThemesPage';
import { AdminTemplatesPage } from './pages/admin/AdminTemplatesPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { seedInitialDataIfEmpty } from './services/adminService';

export default function App() {
  // Automatically check and seed initial dataset on boot
  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
          <Routes>
            
            {/* Public Routes with Top Cyber Navbar */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <HomePage />
                  </main>
                </>
              }
            />

            <Route
              path="/join"
              element={<Navigate to="/" replace />}
            />

            <Route
              path="/game/:gameId"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <PlayerGamePage />
                  </main>
                </>
              }
            />

            <Route
              path="/host"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <HostGamePage />
                  </main>
                </>
              }
            />

            <Route
              path="/host/:gameId"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <HostGamePage />
                  </main>
                </>
              }
            />

            {/* Admin Authentication Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/mfa" element={<AdminMfaPage />} />

            {/* Admin Console Protected Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="games" element={<AdminGamesPage />} />
              <Route path="games/create" element={<AdminGameBuilderPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="questions" element={<AdminQuestionsPage />} />
              <Route path="patterns" element={<AdminPatternsPage />} />
              <Route path="themes" element={<AdminThemesPage />} />
              <Route path="templates" element={<AdminTemplatesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
