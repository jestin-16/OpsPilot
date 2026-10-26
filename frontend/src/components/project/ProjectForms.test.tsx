import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreateProjectModal } from './CreateProjectModal';
import { IntegrationFormModal } from './IntegrationFormModal';
import { TYPE_BY_KEY } from '../../lib/integrationTypes';
import { projectApi } from '../../services/projectApi';

vi.mock('../../context/ProjectContext', () => ({
  useProject: () => ({ refreshProjects: vi.fn().mockResolvedValue(undefined), selectProject: vi.fn() }),
}));
vi.mock('../../services/projectApi', async importOriginal => ({
  ...await importOriginal<typeof import('../../services/projectApi')>(),
  projectApi: { createProject: vi.fn(), createIntegration: vi.fn(), updateIntegration: vi.fn(), testIntegration: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('project form submission validation', () => {
  it('blocks invalid project fields, exposes accessible errors, and allows corrected input', async () => {
    const close = vi.fn();
    vi.mocked(projectApi.createProject).mockResolvedValue({ id: 1 } as Awaited<ReturnType<typeof projectApi.createProject>>);
    render(<MemoryRouter><CreateProjectModal isOpen onClose={close} /></MemoryRouter>);
    const name = screen.getByLabelText('Project name');
    const repository = screen.getByLabelText('Repository URL (optional)');
    fireEvent.change(name, { target: { value: '<Project>' } });
    fireEvent.change(repository, { target: { value: 'https://github.com' } });
    fireEvent.submit(document.getElementById('create-project-form')!);
    expect(projectApi.createProject).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(repository).toHaveAccessibleDescription(/repository URL/);

    fireEvent.change(name, { target: { value: ' Shop API ' } });
    fireEvent.change(repository, { target: { value: ' https://github.com/acme/shop ' } });
    fireEvent.submit(document.getElementById('create-project-form')!);
    await waitFor(() => expect(projectApi.createProject).toHaveBeenCalledWith({ name: 'Shop API', repositoryUrl: 'https://github.com/acme/shop', environment: 'dev', description: undefined }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it('blocks malformed integration URLs and shows the error next to the input', () => {
    render(<IntegrationFormModal projectId={1} def={TYPE_BY_KEY.DOCKER} onClose={vi.fn()} onSaved={vi.fn()} />);
    const host = screen.getByLabelText(/Docker host/);
    fireEvent.change(host, { target: { value: 'http://' } });
    fireEvent.submit(document.getElementById('integration-form')!);
    expect(projectApi.createIntegration).not.toHaveBeenCalled();
    expect(host).toHaveAttribute('aria-invalid', 'true');
    expect(host).toHaveAccessibleDescription(/valid.*URL/);
  });
});
