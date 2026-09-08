import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectWizard } from './pages/ProjectWizard';
import { BlackboxMonitoring } from './pages/BlackboxMonitoring';
import { WhiteboxMonitoring } from './pages/WhiteboxMonitoring';
import { LiveProjectDashboard } from './pages/LiveProjectDashboard';
import { LogManagement } from './pages/LogManagement';
import { NotificationCenter } from './pages/NotificationCenter';
import { PlatformGuide } from './pages/PlatformGuide';
import { LandingPage } from './pages/LandingPage';
import { LogSources } from './pages/LogSources';
import { DockerPage } from './pages/DockerPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { UserManagement } from './pages/UserManagement';
import { AlertProvider } from './components/AlertProvider';
import { AdminGovernance } from './pages/AdminGovernance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSessionLoading } = useAuth();
  if (isSessionLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((role) => {
    const normalizedRole = role.trim().toUpperCase().replace(/\s+/g, '_');
    return normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_ADMIN' || normalizedRole === 'ADMINISTRATOR' || normalizedRole === 'ROLE_ADMINISTRATOR';
  }) ?? false;

  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSessionLoading } = useAuth();
  if (isSessionLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
          <BrowserRouter>
            <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <ProjectWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/log-sources"
              element={
                <ProtectedRoute>
                  <LogSources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <LiveProjectDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/whitebox"
              element={
                <ProtectedRoute>
                  <WhiteboxMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blackbox"
              element={
                <ProtectedRoute>
                  <BlackboxMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <LogManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guide"
              element={
                <ProtectedRoute>
                  <PlatformGuide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/docker"
              element={
                <ProtectedRoute>
                  <DockerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployments"
              element={
                <ProtectedRoute>
                  <DeploymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<ProtectedRoute><AdminRoute><AdminGovernance /></AdminRoute></ProtectedRoute>}
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/monitoring" replace />} />
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
