import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { AlertProvider } from './components/AlertProvider';
import { canAccessRole, isAdmin, type PlatformRole } from './utils/roles';
import { ProjectProvider, useProject } from './context/ProjectContext';

// Each page is its own chunk, loaded the first time its route is visited. The landing and sign-in
// pages stay in the main bundle because they are what a visitor sees first.
function lazyPage<K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}

const VerifyEmailOTP = lazyPage(() => import('./pages/VerifyEmailOTP'), 'VerifyEmailOTP');
const Dashboard = lazyPage(() => import('./pages/Dashboard'), 'Dashboard');
const Projects = lazyPage(() => import('./pages/Projects'), 'Projects');
const LiveOperations = lazyPage(() => import('./pages/LiveOperations'), 'LiveOperations');
const ProjectDetail = lazyPage(() => import('./pages/ProjectDetail'), 'ProjectDetail');
const ProjectWizard = lazyPage(() => import('./pages/ProjectWizard'), 'ProjectWizard');
const BlackboxMonitoring = lazyPage(() => import('./pages/BlackboxMonitoring'), 'BlackboxMonitoring');
const WhiteboxMonitoring = lazyPage(() => import('./pages/WhiteboxMonitoring'), 'WhiteboxMonitoring');
const LiveProjectDashboard = lazyPage(() => import('./pages/LiveProjectDashboard'), 'LiveProjectDashboard');
const LogManagement = lazyPage(() => import('./pages/LogManagement'), 'LogManagement');
const KubernetesDashboard = lazyPage(() => import('./pages/KubernetesDashboard'), 'KubernetesDashboard');
const KubernetesLogsPage = lazyPage(() => import('./pages/KubernetesLogsPage'), 'KubernetesLogsPage');
const GithubActivity = lazyPage(() => import('./pages/GithubActivity'), 'GithubActivity');
const IncidentManagement = lazyPage(() => import('./pages/IncidentManagement'), 'IncidentManagement');
const NotificationCenter = lazyPage(() => import('./pages/NotificationCenter'), 'NotificationCenter');
const PlatformGuide = lazyPage(() => import('./pages/PlatformGuide'), 'PlatformGuide');
const LogSources = lazyPage(() => import('./pages/LogSources'), 'LogSources');
const DeploymentsPage = lazyPage(() => import('./pages/DeploymentsPage'), 'DeploymentsPage');
const UserManagement = lazyPage(() => import('./pages/UserManagement'), 'UserManagement');
const SecuritySettings = lazyPage(() => import('./pages/SecuritySettings'), 'SecuritySettings');
const AdminGovernance = lazyPage(() => import('./pages/AdminGovernance'), 'AdminGovernance');
const AdminDashboard = lazyPage(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const AdminProjectManagement = lazyPage(() => import('./pages/AdminProjectManagement'), 'AdminProjectManagement');
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'ProfilePage');
const Pipelines = lazyPage(() => import('./pages/Pipelines'), 'Pipelines');
const PipelineDetail = lazyPage(() => import('./pages/PipelineDetail'), 'PipelineDetail');
const DeploymentDetail = lazyPage(() => import('./pages/DeploymentDetail'), 'DeploymentDetail');
const ProjectOverview = lazyPage(() => import('./pages/ProjectOverview'), 'ProjectOverview');
const ProjectIntegrations = lazyPage(() => import('./pages/ProjectIntegrations'), 'ProjectIntegrations');
const ProjectLogs = lazyPage(() => import('./pages/ProjectLogs'), 'ProjectLogs');
const IntegrationLogs = lazyPage(() => import('./pages/IntegrationLogs'), 'IntegrationLogs');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Shown while a page's chunk downloads; usually a few milliseconds. */
const PageLoading: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]" role="status" aria-label="Loading">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
  </div>
);

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

/** /logs: with a project selected, go to its unified live logs; otherwise keep the cross-project search. */
const LogsEntry: React.FC = () => {
  const { currentProjectId } = useProject();
  return currentProjectId != null ? <Navigate to={`/projects/${currentProjectId}/logs`} replace /> : <LogManagement />;
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

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ConfirmProvider } from './components/ConfirmProvider';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AlertProvider>
          <ConfirmProvider>
          <BrowserRouter>
            <ProjectProvider>
            <Suspense fallback={<PageLoading />}>
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
                  <AuthPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <AuthPage />
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
              path="/operations"
              element={
                <ProtectedRoute>
                  <LiveOperations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><ProjectOverview /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/details"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><ProjectDetail /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/logs"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><ProjectLogs /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/logs/:integrationId"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><IntegrationLogs /></RoleRoute>
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
              path="/projects/:id/integrations"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><ProjectIntegrations /></RoleRoute>
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
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><LogsEntry /></RoleRoute>
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
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><LogSources /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kubernetes"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><KubernetesDashboard /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kubernetes/logs"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><KubernetesLogsPage /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/github"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><GithubActivity /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS', 'ADMIN']}><IncidentManagement /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/pipelines"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><Pipelines /></RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipelines/:id"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><PipelineDetail /></RoleRoute>
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
              path="/deployments/:id"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['DEVELOPER', 'DEVOPS']}><DeploymentDetail /></RoleRoute>
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
            <Route
              path="/settings/security"
              element={
                <ProtectedRoute>
                  <SecuritySettings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/monitoring" replace />} />
            </Routes>
            </Suspense>
            </ProjectProvider>
          </BrowserRouter>
          </ConfirmProvider>
        </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
