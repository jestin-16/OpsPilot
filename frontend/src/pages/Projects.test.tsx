import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Projects } from './Projects';
import { api, type Project, type Deployment } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getProjects: vi.fn(),
    getDeployments: vi.fn(),
    recordDeployment: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alice Admin', email: 'alice@opspilot.io', roles: ['ADMIN'] },
    token: 'jwt-token',
    isAuthenticated: true,
    isSessionLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    projects: [],
    currentProject: null,
    selectProject: vi.fn(),
    refreshProjects: vi.fn(),
  }),
}));

vi.mock('../components/SidebarLayout', () => ({
  SidebarLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-layout">{children}</div>,
}));

vi.mock('../components/project/CreateProjectModal', () => ({
  CreateProjectModal: () => null,
}));

describe('Projects - Deployments Dialog', () => {
  const mockProjects: Project[] = [
    {
      id: 101,
      projectName: 'Order Service',
      description: 'Handles order processing',
      repositoryUrl: 'https://github.com/opspilot/order-service',
      ownerId: 1,
      ownerName: 'Alice Admin',
      ownerEmail: 'alice@opspilot.io',
      status: 'ACTIVE',
      deployedUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockDeployments: Deployment[] = [
    {
      id: 501,
      projectId: 101,
      projectName: 'Order Service',
      version: 'v1.2.3',
      environment: 'Production',
      status: 'Succeeded',
      deployedById: 1,
      deployedByName: 'Alice Admin',
      actor: 'Alice Admin',
      deployedAt: '2026-10-15T08:00:00Z',
      source: 'MANUAL',
      url: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getProjects as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjects);
    (api.getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeployments);
    (api.recordDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 502,
      projectId: 101,
      projectName: 'Order Service',
      version: 'v1.3.0',
      environment: 'Staging',
      status: 'Succeeded',
      deployedBy: 'Alice Admin',
      deployedAt: '2026-10-15T09:00:00Z',
      source: 'MANUAL',
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

  it('renders projects and opens Deployments dialog when clicking Deployments', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Order Service')).toBeInTheDocument();
    });

    const deployButton = screen.getByRole('button', { name: /Deployments/i });
    await user.click(deployButton);

    await waitFor(() => {
      expect(api.getDeployments).toHaveBeenCalledWith(101);
      expect(screen.getByText(/Deployments of/i)).toBeInTheDocument();
      expect(screen.getByText('Order Service', { selector: 'span.text-op-accent' })).toBeInTheDocument();
    });

    // Form fields are present
    expect(screen.getByDisplayValue('Production')).toBeInTheDocument();
    expect(screen.getByDisplayValue('v1.0.0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Succeeded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record deployment/i })).toBeInTheDocument();

    // Past deployment history table is rendered
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(screen.getByText('Recorded')).toBeInTheDocument();
  });

  it('records a new deployment and updates history', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Order Service')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Deployments/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Record deployment/i })).toBeInTheDocument();
    });

    // Update form fields
    const versionInput = screen.getByDisplayValue('v1.0.0');
    await user.clear(versionInput);
    await user.type(versionInput, 'v2.0.0');

    const envSelect = screen.getByDisplayValue('Production');
    await user.selectOptions(envSelect, 'Staging');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Record deployment/i }));

    await waitFor(() => {
      expect(api.recordDeployment).toHaveBeenCalledWith(101, {
        version: 'v2.0.0',
        environment: 'Staging',
        status: 'Succeeded',
      });
      // Verifies history is re-fetched after recording
      expect(api.getDeployments).toHaveBeenCalledTimes(2);
    });
  });

  it('closes deployments dialog when clicking the close button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Order Service')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Deployments/i }));

    await waitFor(() => {
      expect(screen.getByText(/Deployments of/i)).toBeInTheDocument();
    });

    // Find and click close button
    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Deployments of/i)).not.toBeInTheDocument();
    });
  });
});
