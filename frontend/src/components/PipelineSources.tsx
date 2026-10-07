import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Check, Pencil, Trash2, Plug, KeyRound, RefreshCw, GitBranch, Server } from 'lucide-react';
import { api, API_BASE_URL, type PipelineSource, type PipelineSourceInput, type PipelineSourceProvider } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card } from './Card';
import { Input } from './Input';
import { Table, type Column } from './Table';
import { useConfirm } from './ConfirmProvider';

const PROVIDER_LABEL: Record<PipelineSourceProvider, string> = {
  GITHUB_ACTIONS: 'GitHub Actions',
  JENKINS: 'Jenkins',
};

const emptyForm = {
  name: '',
  provider: 'GITHUB_ACTIONS' as PipelineSourceProvider,
  repoFullName: '',
  accessToken: '',
  baseUrl: '',
  jobName: '',
  username: '',
  apiToken: '',
};
type FormState = typeof emptyForm;

export const webhookUrlFor = (source: Pick<PipelineSource, 'webhookPath'>): string => {
  let origin = window.location.origin;
  try {
    origin = new URL(API_BASE_URL).origin;
  } catch {
    /* relative base URL: fall back to the page origin */
  }
  return `${origin}${source.webhookPath}`;
};

const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the value is still selectable in the field */
    }
  };
  return (
    <Button type="button" variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
};

const SecretField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-xs font-semibold text-op-muted tracking-wide mb-1.5">{label}</div>
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 bg-op-input text-op-fg text-xs font-mono rounded-lg border border-op-border-strong px-3 py-2.5 outline-none"
      />
      <CopyButton value={value} label={label} />
    </div>
  </div>
);

interface Props {
  isAddOpen: boolean;
  onAddClose: () => void;
  onChanged?: () => void;
}

export const PipelineSources: React.FC<Props> = ({ isAddOpen, onAddClose, onChanged }) => {
  const { confirm } = useConfirm();
  const [sources, setSources] = useState<PipelineSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PipelineSource | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [created, setCreated] = useState<PipelineSource | null>(null);
  const [testing, setTesting] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({});

  const load = useCallback(async () => {
    try {
      setSources(await api.getPipelineSources());
    } catch (err) {
      console.error('Failed to load pipeline sources', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset the form whenever the "add" modal opens.
  useEffect(() => {
    if (isAddOpen) {
      setEditing(null);
      setForm(emptyForm);
      setErrors({});
      setSaveError(null);
      setCreated(null);
    }
  }, [isAddOpen]);

  const modalOpen = isAddOpen || editing !== null;
  const closeModal = () => {
    setEditing(null);
    setCreated(null);
    onAddClose();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.provider === 'GITHUB_ACTIONS') {
      if (!/^[\w.-]+\/[\w.-]+$/.test(form.repoFullName.trim())) e.repoFullName = 'Use owner/repo format';
    } else {
      if (!/^https?:\/\/\S+$/.test(form.baseUrl.trim())) e.baseUrl = 'Must start with http:// or https://';
      if (!form.jobName.trim()) e.jobName = 'Job name is required';
      if (!editing && !form.username.trim()) e.username = 'Username is required';
      if (!editing && !form.apiToken.trim()) e.apiToken = 'API token is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const startEdit = (s: PipelineSource) => {
    setForm({
      name: s.name,
      provider: s.provider,
      repoFullName: s.repoFullName ?? '',
      accessToken: '',
      baseUrl: s.baseUrl ?? '',
      jobName: s.jobName ?? '',
      username: s.username ?? '',
      apiToken: '',
    });
    setErrors({});
    setSaveError(null);
    setCreated(null);
    setEditing(s);
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    const input: PipelineSourceInput = { name: form.name.trim(), provider: form.provider };
    if (form.provider === 'GITHUB_ACTIONS') {
      input.repoFullName = form.repoFullName.trim();
      if (form.accessToken.trim()) input.accessToken = form.accessToken.trim();
    } else {
      input.baseUrl = form.baseUrl.trim();
      input.jobName = form.jobName.trim();
      if (form.username.trim()) input.username = form.username.trim();
      if (form.apiToken.trim()) input.apiToken = form.apiToken.trim();
    }
    try {
      if (editing) {
        input.projectId = editing.projectId ?? null;
        await api.updatePipelineSource(editing.id, input);
        closeModal();
      } else {
        setCreated(await api.createPipelineSource(input));
      }
      await load();
      onChanged?.();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save source');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: PipelineSource) => {
    try {
      await api.updatePipelineSource(s.id, {
        name: s.name,
        provider: s.provider,
        enabled: !s.enabled,
        repoFullName: s.repoFullName,
        baseUrl: s.baseUrl,
        jobName: s.jobName,
        projectId: s.projectId ?? null,
      });
      await load();
    } catch (err) {
      console.error('Failed to toggle source', err);
    }
  };

  const remove = async (s: PipelineSource) => {
    const ok = await confirm(`Delete source "${s.name}"? Existing runs are kept but lose their source link.`, {
      confirmText: 'Delete',
    });
    if (!ok) return;
    await api.deletePipelineSource(s.id);
    await load();
    onChanged?.();
  };

  const test = async (s: PipelineSource) => {
    setTesting(s.id);
    try {
      const result = await api.testPipelineSource(s.id);
      setTestResults((r) => ({ ...r, [s.id]: result }));
    } catch {
      setTestResults((r) => ({ ...r, [s.id]: { success: false, message: 'Request failed' } }));
    } finally {
      setTesting(null);
    }
  };

  const rotate = async (s: PipelineSource) => {
    const ok = await confirm('Regenerate the webhook secret? The old secret stops working immediately.', {
      confirmText: 'Regenerate',
    });
    if (!ok) return;
    setCreated(await api.regeneratePipelineSourceSecret(s.id));
  };

  const reveal = async (s: PipelineSource) => {
    setCreated(await api.revealPipelineSourceSecret(s.id));
  };

  const columns: Column<PipelineSource>[] = [
    { key: 'name', header: 'Source', render: (s) => (
      <div className="flex items-center gap-2">
        {s.provider === 'GITHUB_ACTIONS' ? <GitBranch className="w-4 h-4 text-op-muted" /> : <Server className="w-4 h-4 text-op-muted" />}
        <div>
          <div className="font-medium text-op-fg">{s.name}</div>
          <div className="text-xs text-op-subtle font-mono">{s.repoFullName || `${s.baseUrl ?? ''} · ${s.jobName ?? ''}`}</div>
        </div>
      </div>
    )},
    { key: 'provider', header: 'Provider', render: (s) => (
      <Badge variant={s.provider === 'GITHUB_ACTIONS' ? 'info' : 'neutral'}>{PROVIDER_LABEL[s.provider]}</Badge>
    )},
    { key: 'lastRun', header: 'Last run', render: (s) => (
      <span className="text-sm text-op-muted">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}</span>
    )},
    { key: 'enabled', header: 'Enabled', render: (s) => (
      <button
        type="button"
        role="switch"
        aria-checked={s.enabled}
        aria-label={`${s.enabled ? 'Disable' : 'Enable'} ${s.name}`}
        onClick={() => toggle(s)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.enabled ? 'bg-op-accent' : 'bg-op-border-strong'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    )},
    { key: 'actions', header: 'Actions', render: (s) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" onClick={() => test(s)} isLoading={testing === s.id} title="Test connection">
            <Plug className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => reveal(s)} title="Show webhook URL & secret">
            <KeyRound className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => rotate(s)} title="Regenerate secret">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => startEdit(s)} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => remove(s)} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {testResults[s.id] && (
          <span className={`text-xs ${testResults[s.id].success ? 'text-op-success' : 'text-op-danger'}`}>
            {testResults[s.id].message}
          </span>
        )}
      </div>
    )},
  ];

  const isGithub = form.provider === 'GITHUB_ACTIONS';

  return (
    <>
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-op-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-op-fg">Sources</h2>
          <span className="text-xs text-op-muted">{sources.length} configured</span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-op-muted animate-pulse">Loading sources...</div>
        ) : (
          <Table
            data={sources}
            columns={columns}
            keyExtractor={(s) => s.id}
            emptyMessage="No sources yet. Click “Add source” to connect GitHub Actions or Jenkins."
          />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        size="lg"
        title={created ? 'Webhook details' : editing ? 'Edit source' : 'Add pipeline source'}
        footer={
          created ? (
            <Button type="button" onClick={closeModal}>Done</Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="button" onClick={submit} isLoading={saving}>{editing ? 'Save changes' : 'Create source'}</Button>
            </>
          )
        }
      >
        {created ? (
          <div className="space-y-4">
            <SecretField label="Webhook URL" value={webhookUrlFor(created)} />
            <SecretField label="Webhook secret" value={created.webhookSecret ?? ''} />
            <p className="text-sm text-op-muted">
              {created.provider === 'GITHUB_ACTIONS'
                ? 'In GitHub: Settings → Webhooks → Add webhook, set content type to application/json, paste the secret, and select the “Workflow runs” event.'
                : 'In Jenkins Notification Plugin: add the URL as an HTTP endpoint and send the secret in the X-Jenkins-Token header.'}
            </p>
            <p className="text-xs text-op-subtle">Copy the secret now; it is only shown here and via “Show webhook URL & secret”.</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-provider" className="text-xs font-semibold text-op-muted tracking-wide">Provider</label>
              <select
                id="source-provider"
                value={form.provider}
                disabled={!!editing}
                onChange={(e) => set('provider', e.target.value as PipelineSourceProvider)}
                className="w-full bg-op-input text-op-fg text-sm rounded-lg border border-op-border-strong px-3 py-2.5 outline-none focus:ring-2 focus:ring-op-accent/40 disabled:opacity-60"
              >
                <option value="GITHUB_ACTIONS">GitHub Actions</option>
                <option value="JENKINS">Jenkins</option>
              </select>
            </div>
            <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Payments CI" />
            {isGithub ? (
              <>
                <Input label="Repository (owner/repo)" value={form.repoFullName} onChange={(e) => set('repoFullName', e.target.value)} error={errors.repoFullName} placeholder="octocat/hello-world" />
                <Input label={editing?.hasAccessToken ? 'Access token (leave blank to keep current)' : 'Access token (optional)'} type="password" value={form.accessToken} onChange={(e) => set('accessToken', e.target.value)} placeholder="ghp_…" autoComplete="off" />
              </>
            ) : (
              <>
                <Input label="Base URL" value={form.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} error={errors.baseUrl} placeholder="https://jenkins.example.com" />
                <Input label="Job name" value={form.jobName} onChange={(e) => set('jobName', e.target.value)} error={errors.jobName} placeholder="my-pipeline" />
                <Input label="Username" value={form.username} onChange={(e) => set('username', e.target.value)} error={errors.username} autoComplete="off" />
                <Input label={editing?.hasApiToken ? 'API token (leave blank to keep current)' : 'API token'} type="password" value={form.apiToken} onChange={(e) => set('apiToken', e.target.value)} error={errors.apiToken} autoComplete="off" />
              </>
            )}
            {saveError && <p className="text-sm text-op-danger">{saveError}</p>}
            <button type="submit" className="hidden" />
          </form>
        )}
      </Modal>
    </>
  );
};
