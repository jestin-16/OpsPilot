import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DeploymentDetail } from './DeploymentDetail';
import { api, type Deployment, type LogEntry } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getDeployment: vi.fn(),
    getDeploymentLogs: vi.fn(),
  },
}));

vi.mock('../components/SidebarLayout', () => ({
  SidebarLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-layout">{children}</div>,
}));

vi.mock('../components/Timeline', () => ({
  Timeline: ({ events }: { events: unknown[] }) => (
    <div data-testid="timeline-events">{events.length} timeline events</div>
  ),
}));

describe('DeploymentDetail Page', () => {
  const mockDeployment: Deployment = {
    id: 123,
    projectId: 10,
    projectName: 'Payment Gateway',
    version: 'v2.4.1',
    environment: 'production',
    status: 'Succeeded',
    deployedById: 2,
    deployedByName: 'Bob DevOps',
    actor: 'Bob DevOps',
    deployedAt: '2026-10-15T10:00:00Z',
    source: 'GITHUB',
    url: 'https://payment.example.com',
  };

  const mockLogs: LogEntry[] = [
    {
      logId: 1,
      sourceService: 'payment-svc',
      logLevel: 'INFO',
      message: 'Service starting',
      timestamp: '2026-10-15T09:59:00Z',
    },
    {
      logId: 2,
      sourceService: 'payment-svc',
      logLevel: 'WARN',
      message: 'Connection pool near capacity',
      timestamp: '2026-10-15T10:01:00Z',
    },
    {
      logId: 3,
      sourceService: 'payment-svc',
      logLevel: 'ERROR',
      message: 'Timeout contacting bank gateway',
      timestamp: '2026-10-15T10:02:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (deploymentId = '123') =>
    render(
      <MemoryRouter initialEntries={[`/deployments/${deploymentId}`]}>
        <Routes>
          <Route path="/deployments/:id" element={<DeploymentDetail />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders deployment details and logs successfully', async () => {
    (api.getDeployment as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDeployment);
    (api.getDeploymentLogs as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockLogs);

    renderComponent('123');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Deployment #123/ })).toBeInTheDocument();
      expect(screen.getByText('Succeeded')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Payment Gateway')).toBeInTheDocument();
      expect(screen.getByText('v2.4.1')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getAllByText('Bob DevOps').length).toBeGreaterThanOrEqual(1);
    });

    // Verifies Open URL link is rendered
    const openLink = screen.getByRole('link', { name: /Open/i });
    expect(openLink).toHaveAttribute('href', 'https://payment.example.com');

    // Verifies notable logs (WARN & ERROR) are displayed
    expect(screen.getByText('Timeout contacting bank gateway')).toBeInTheDocument();
    expect(screen.getByText('Connection pool near capacity')).toBeInTheDocument();
  });

  it('renders warning banner for simulated legacy deployments', async () => {
    const simulatedDeployment: Deployment = {
      ...mockDeployment,
      id: 999,
      source: 'SIMULATED',
    };

    (api.getDeployment as ReturnType<typeof vi.fn>).mockResolvedValueOnce(simulatedDeployment);
    (api.getDeploymentLogs as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    renderComponent('999');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Deployment #999/ })).toBeInTheDocument();
      expect(screen.getByText('Simulated (legacy)')).toBeInTheDocument();
      expect(screen.getByText(/This record was produced by the deployment simulator that has been removed/i)).toBeInTheDocument();
    });
  });

  it('renders not found state when deployment does not exist', async () => {
    (api.getDeployment as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
    (api.getDeploymentLogs as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    renderComponent('404');

    await waitFor(() => {
      expect(screen.getByText('Deployment not found.')).toBeInTheDocument();
    });
  });

  it('refreshes deployment details when clicking refresh button', async () => {
    const user = userEvent.setup();
    (api.getDeployment as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeployment);
    (api.getDeploymentLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);

    renderComponent('123');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Deployment #123/ })).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(api.getDeployment).toHaveBeenCalledTimes(2);
      expect(api.getDeploymentLogs).toHaveBeenCalledTimes(2);
    });
  });
});
