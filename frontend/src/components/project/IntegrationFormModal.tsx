import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { initialValues, isVisible, toPayload, validate, type FieldDef, type IntegrationTypeDef } from '../../lib/integrationTypes';
import { errorMessage, projectApi, type ProjectIntegration } from '../../services/projectApi';
import { AppLogsInstructions, CodeBlock, githubWebhookUrl } from './IngestInstructions';
import { StatusPill } from './badges';

interface Props {
  projectId: number;
  def: IntegrationTypeDef;
  /** Present when configuring an existing integration. */
  existing?: ProjectIntegration;
  onClose: () => void;
  /** Called after a successful save (and test, when creating). */
  onSaved: (integration: ProjectIntegration) => void;
}

const inputCls = 'w-full bg-op-input text-op-fg text-sm rounded-lg border border-op-border-strong focus:border-op-accent px-3 py-2.5 outline-none focus:ring-2 focus:ring-op-accent/40 font-medium';

const Field: React.FC<{ field: FieldDef; value: string; stored: boolean; onChange: (v: string) => void }> = ({ field, value, stored, onChange }) => {
  const id = `field-${field.key}`;
  const placeholder = field.secret && stored ? '•••••••• saved — leave blank to keep' : field.placeholder;
  return (
    <div className="flex flex-col gap-1.5">
      {field.kind === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm font-medium text-op-fg">
          <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : '')} className="h-4 w-4 rounded border-op-border-strong" />
          {field.label}
        </label>
      ) : (
        <>
          <label htmlFor={id} className="text-xs font-semibold text-op-muted tracking-wide">
            {field.label}{field.required && <span className="text-rose-500"> *</span>}
          </label>
          {field.kind === 'textarea' ? (
            <textarea id={id} rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} font-mono text-xs`} autoComplete="off" spellCheck={false} />
          ) : field.kind === 'select' ? (
            <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
              {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              id={id}
              type={field.kind === 'number' ? 'number' : field.kind === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={inputCls}
              autoComplete={field.kind === 'password' ? 'new-password' : 'off'}
              spellCheck={false}
            />
          )}
        </>
      )}
      {field.help && <p className="text-[11px] text-op-subtle">{field.help}</p>}
    </div>
  );
};

export const IntegrationFormModal: React.FC<Props> = ({ projectId, def, existing, onClose, onSaved }) => {
  const [name, setName] = useState(existing?.name ?? `${def.label} integration`);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(def, existing?.config));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ProjectIntegration | null>(null);

  useEffect(() => {
    setName(existing?.name ?? `${def.label} integration`);
    setValues(initialValues(def, existing?.config));
    setError(null);
    setCreated(null);
  }, [def, existing]);

  const stored = existing?.credentialKeys ?? [];
  const visible = useMemo(() => def.fields.filter((f) => isVisible(f, values)), [def, values]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    const problem = validate(def, values, stored);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const { config, secrets } = toPayload(def, values);
      let saved: ProjectIntegration;
      if (existing) {
        saved = await projectApi.updateIntegration(projectId, existing.id, { name: name.trim(), config, secrets });
        saved = await projectApi.testIntegration(projectId, saved.id);
      } else {
        const made = await projectApi.createIntegration(projectId, { provider: def.type, name: name.trim(), category: def.category, config, secrets });
        const token = made.ingestToken; // only returned here
        saved = def.type === 'APP_LOGS' ? made : await projectApi.testIntegration(projectId, made.id);
        saved = { ...saved, ingestToken: token };
      }
      if (!existing && (def.type === 'APP_LOGS' || def.type === 'GITHUB')) {
        setCreated(saved); // show the one-time token / webhook URL before closing
        onSaved(saved);
      } else {
        onSaved(saved);
        onClose();
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not save the integration'));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <Modal isOpen onClose={onClose} title={`${def.label} connected`} size="lg" footer={<Button onClick={onClose}>Done</Button>}>
        <div className="space-y-4">
          <div className="flex items-center gap-2"><StatusPill status={created.status} /><span className="text-sm font-semibold text-slate-700">{created.name}</span></div>
          {created.statusMessage && <p className="text-sm text-slate-600">{created.statusMessage}</p>}
          {def.type === 'APP_LOGS' && created.ingestToken && (
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Copy this token now. It is shown only once and cannot be recovered; create a new integration if you lose it.
              </div>
              <CodeBlock title="Ingest token" code={created.ingestToken} />
              <AppLogsInstructions projectId={projectId} token={created.ingestToken} />
            </>
          )}
          {def.type === 'GITHUB' && (
            <>
              <p className="text-sm text-slate-600">For instant events, add a webhook in the repository settings (content type <code>application/json</code>, events: push, pull requests, workflow runs) using the secret you entered:</p>
              <CodeBlock title="Webhook URL" code={githubWebhookUrl(projectId, created.id)} />
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={busy ? () => undefined : onClose}
      title={existing ? `Configure ${existing.name}` : `Connect ${def.label}`}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="integration-form" isLoading={busy}>{existing ? 'Save & test' : def.type === 'APP_LOGS' ? 'Create' : 'Connect & test'}</Button>
        </>
      }
    >
      <form id="integration-form" onSubmit={submit} className="space-y-4">
        <p className="text-sm text-op-subtle">{def.description}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="integration-name" className="text-xs font-semibold text-op-muted tracking-wide">Name <span className="text-rose-500">*</span></label>
          <input id="integration-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={100} />
        </div>
        {visible.map((f) => (
          <Field key={f.key} field={f} value={values[f.key] ?? ''} stored={stored.includes(f.key)} onChange={(v) => setValues((cur) => ({ ...cur, [f.key]: v }))} />
        ))}
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <p className="text-[11px] text-op-subtle">Secrets are encrypted at rest and never shown again.</p>
      </form>
    </Modal>
  );
};
