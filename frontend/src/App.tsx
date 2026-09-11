import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { VerifyEmailOTP } from './pages/VerifyEmailOTP';
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
import { canAccessRole, isAdmin, type PlatformRole } from './utils/roles';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProjectManagement } from './pages/AdminProjectManagement';

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

const RoleRoute: React.FC<{ allowedRoles: PlatformRole[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  return canAccessRole(user?.roles, allowedRoles) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const DashboardEntry: React.FC = () => {
  const { user } = useAuth();
  return isAdmin(user?.roles) ? <AdminDashboard /> : <Dashboard />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user?.roles);

  return userIsAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
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
              path="/verify-email"
              element={<PublicRoute><VerifyEmailOTP /></PublicRoute>}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><Projects /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER']}><ProjectWizard /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new/:projectId"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER']}><ProjectWizard /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/log-sources"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER']}><LogSources /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><LiveProjectDashboard /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/whitebox"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVOPS']}><WhiteboxMonitoring /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blackbox"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVOPS']}><BlackboxMonitoring /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVOPS']}><LogManagement /></RoleRoute>
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
                  <RoleRoute allowedRoles={['DEVOPS', 'ADMIN']}><DockerPage /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployments"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><DeploymentsPage /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={<ProtectedRoute><AdminRoute><AdminProjectManagement /></AdminRoute></ProtectedRoute>}
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
