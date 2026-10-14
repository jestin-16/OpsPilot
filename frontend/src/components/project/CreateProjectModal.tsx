import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { useProject } from '../../context/ProjectContext';
import { errorMessage, projectApi, type Environment } from '../../services/projectApi';

const ENVIRONMENTS: Array<{ value: Environment; label: string }> = [
  { value: 'dev', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { refreshProjects, selectProject } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<Environment>('dev');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setEnvironment('dev');
    setRepositoryUrl('');
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const project = await projectApi.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        environment,
        repositoryUrl: repositoryUrl.trim() || undefined,
      });
      await refreshProjects();
      selectProject(project.id);
      reset();
      onClose();
      navigate(`/projects/${project.id}/integrations`);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the project'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Create project"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="create-project-form" isLoading={submitting}>Create project</Button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={submit} className="space-y-4">
        <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop API" maxLength={100} autoFocus required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-environment" className="text-xs font-semibold text-op-muted tracking-wide">Environment</label>
          <select
            id="project-environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
            className="w-full bg-op-input text-op-fg text-sm rounded-lg border border-op-border-strong focus:border-op-accent px-3 py-2.5 outline-none focus:ring-2 focus:ring-op-accent/40 font-medium"
          >
            {ENVIRONMENTS.map((env) => <option key={env.value} value={env.value}>{env.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-description" className="text-xs font-semibold text-op-muted tracking-wide">Description</label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full bg-op-input text-op-fg text-sm rounded-lg border border-op-border-strong focus:border-op-accent px-3 py-2.5 outline-none focus:ring-2 focus:ring-op-accent/40 font-medium"
          />
        </div>
        <Input label="Repository URL (optional)" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/acme/shop" />
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <p className="text-xs text-op-subtle">You will connect Docker, Kubernetes, Git, CI/CD and app logs next.</p>
      </form>
    </Modal>
  );
};
