import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Cloud, Loader2, PlugZap, Plus, Settings2, Trash2, Zap } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';
import { ErrorBanner, ProjectHeader } from '../components/project/ProjectHeader';
import { IntegrationFormModal } from '../components/project/IntegrationFormModal';
import { AppLogsInstructions, CodeBlock } from '../components/project/IngestInstructions';
import { githubWebhookUrl } from '../lib/urls';
import { StatusPill } from '../components/project/badges';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useProjectIntegrations, integrationsKey } from '../hooks/useProjectIntegrations';
import { INTEGRATION_TYPES, TYPE_BY_KEY, TYPE_ICONS, type IntegrationTypeDef } from '../lib/integrationTypes';
import { errorMessage, projectApi, type ProjectIntegration } from '../services/projectApi';

type FormState = { def: IntegrationTypeDef; existing?: ProjectIntegration } | null;

export const ProjectIntegrations: React.FC = () => {
  const projectId = Number(useParams().id);
  const [search, setSearch] = useSearchParams();
  const { showAlert } = useAlert();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const { data: integrations = [], isLoading, isError, error, refetch } = useProjectIntegrations(projectId);
  const [form, setForm] = useState<FormState>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [info, setInfo] = useState<ProjectIntegration | null>(null);

  // /projects/:id/integrations?connect=DOCKER opens the connect form directly (used by the overview page).
  const requested = search.get('connect');
  const requestedDef = requested ? TYPE_BY_KEY[requested] : undefined;
  const activeForm: FormState = form ?? (requestedDef ? { def: requestedDef } : null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: integrationsKey(projectId) });
  const closeForm = () => {
    setForm(null);
    if (search.has('connect')) {
      const next = new URLSearchParams(search);
      next.delete('connect');
      setSearch(next, { replace: true });
    }
  };

  const run = async (id: number, action: () => Promise<unknown>, success?: string) => {
    setBusy(id);
    try {
      await action();
      if (success) showAlert(success, 'success');
    } catch (err) {
      showAlert(errorMessage(err, 'Action failed'), 'error');
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const test = (i: ProjectIntegration) =>
    run(i.id, async () => {
      const result = await projectApi.testIntegration(projectId, i.id);
      showAlert(result.statusMessage ?? (result.status === 'CONNECTED' ? 'Connection successful' : 'Connection failed'), result.status === 'CONNECTED' ? 'success' : 'error');
    });

  const disconnect = async (i: ProjectIntegration) => {
    if (!(await confirm(`Disconnect "${i.name}"? Logs already stored are kept, but new ones stop arriving.`, { confirmText: 'Disconnect' }))) return;
    await run(i.id, () => projectApi.disconnectIntegration(projectId, i.id), `${i.name} disconnected`);
  };

  const remove = async (i: ProjectIntegration) => {
    if (!(await confirm(`Delete "${i.name}" and its saved credentials? This cannot be undone.`, { confirmText: 'Delete' }))) return;
    await run(i.id, () => projectApi.deleteIntegration(projectId, i.id), `${i.name} deleted`);
  };

  const known = new Set<string>(INTEGRATION_TYPES.map((t) => t.type));
  const legacy = integrations.filter((i) => !known.has(i.provider));

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-8">
        <ProjectHeader projectId={projectId} title="Integrations" subtitle="Connect the systems whose logs you want to watch in this project." />

        {isError && <ErrorBanner message={errorMessage(error, 'Could not load integrations')} onRetry={() => refetch()} />}

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATION_TYPES.map((def) => {
              const Icon = TYPE_ICONS[def.type];
              const items = integrations.filter((i) => i.provider === def.type);
              return (
                <section key={def.type} aria-labelledby={`it-${def.type}`} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h2 id={`it-${def.type}`} className="text-base font-bold text-slate-800">{def.label}</h2>
                      <p className="text-xs font-medium text-slate-500">{def.description}</p>
                    </div>
                  </div>

                  <ul className="mt-4 flex-1 space-y-3">
                    {items.length === 0 && <li className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs font-medium text-slate-400">Not connected</li>}
                    {items.map((i) => (
                      <li key={i.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-700">{i.name}</span>
                          <StatusPill status={i.status} />
                        </div>
                        {i.lastCheckedAt && <p className="mt-1 text-[11px] text-slate-400">Checked {new Date(i.lastCheckedAt).toLocaleString()}</p>}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {busy === i.id ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Working…</span>
                          ) : (
                            <>
                              <button onClick={() => test(i)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"><Zap className="h-3 w-3" />Test</button>
                              <button onClick={() => setForm({ def, existing: i })} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"><Settings2 className="h-3 w-3" />Configure</button>
                              {def.type === 'APP_LOGS' && <button onClick={() => setInfo(i)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">How to send</button>}
                              {def.type === 'GITHUB' && <button onClick={() => setInfo(i)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">Webhook</button>}
                              {i.status !== 'DISCONNECTED' && <button onClick={() => disconnect(i)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700"><PlugZap className="h-3 w-3" />Disconnect</button>}
                              <button onClick={() => remove(i)} aria-label={`Delete ${i.name}`} className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 hover:border-rose-300 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                              <Link to={`/projects/${projectId}/logs/${i.id}`} className="ml-auto inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700">View logs</Link>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Button variant={items.length === 0 ? 'primary' : 'secondary'} className="mt-4 w-full" onClick={() => setForm({ def })}>
                    <Plus className="mr-1.5 h-4 w-4" />{items.length === 0 ? 'Connect' : 'Add another'}
                  </Button>
                </section>
              );
            })}
          </div>
        )}

        {legacy.length > 0 && (
          <section aria-labelledby="legacy-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 id="legacy-heading" className="flex items-center gap-2 text-sm font-bold text-slate-700"><Cloud className="h-4 w-4" />Other integrations</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {legacy.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-700">{i.name} <span className="text-xs font-medium text-slate-400">({i.provider})</span></span>
                  <span className="flex items-center gap-3"><StatusPill status={i.status} /><button onClick={() => remove(i)} aria-label={`Delete ${i.name}`} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {activeForm && (
        <IntegrationFormModal projectId={projectId} def={activeForm.def} existing={activeForm.existing} onClose={closeForm} onSaved={() => refresh()} />
      )}

      {info && (
        <Modal isOpen onClose={() => setInfo(null)} title={info.provider === 'GITHUB' ? 'GitHub webhook' : 'Send application logs'} size="lg" footer={<Button onClick={() => setInfo(null)}>Close</Button>}>
          {info.provider === 'GITHUB' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Add a webhook to the repository (content type <code>application/json</code>; events: push, pull requests, workflow runs) with the secret saved on this integration.</p>
              <CodeBlock title="Payload URL" code={githubWebhookUrl(projectId, info.id)} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Token prefix <code>{info.ingestTokenPrefix}</code>. The full token was shown once when this integration was created.</p>
              <AppLogsInstructions projectId={projectId} prefix={info.ingestTokenPrefix} />
            </div>
          )}
        </Modal>
      )}
    </SidebarLayout>
  );
};
