import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { AcceptInvitePage, LoginPage, RegisterPage } from './components/auth/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import { ExecutionsPage, ExecutionDetailPage, WorkflowExecutionsPage } from './components/execution/ExecutionPages';
import { SettingsPage } from './pages/SettingsPage';
import { AuditPage, NotificationsPage, SchedulerPage, TeamPage, WebhooksPage } from './pages/PlatformPages';
import { AiAgentsPage, AiGeneratorPage, IntegrationHubPage } from './pages/AiPages';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      {/* Builder gets full screen — no sidebar */}
      <Route path="/workflows/:id" element={
        <Protected><WorkflowBuilderPage /></Protected>
      } />

      <Route path="/*" element={
        <Protected>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/executions" element={<ExecutionsPage />} />
              <Route path="/executions/:id" element={<ExecutionDetailPage />} />
              <Route path="/workflows/:workflowId/executions" element={<WorkflowExecutionsPage />} />
              <Route path="/webhooks" element={<WebhooksPage />} />
              <Route path="/scheduler" element={<SchedulerPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/ai/generator" element={<AiGeneratorPage />} />
              <Route path="/ai/agents" element={<AiAgentsPage />} />
              <Route path="/integrations" element={<IntegrationHubPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
        </Protected>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
