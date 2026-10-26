import React, { useEffect, useMemo, useState } from 'react';
import { Check, Lock, ShieldCheck } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { initialValues, isVisible, toPayload, validateFields, type FieldDef, type IntegrationTypeDef } from '../../lib/integrationTypes';
import { resourceName } from '../../lib/formValidation';
import { errorMessage, projectApi, type ProjectIntegration } from '../../services/projectApi';
import { AppLogsInstructions, CodeBlock } from './IngestInstructions';
import { githubWebhookUrl } from '../../lib/urls';
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

const Field: React.FC<{ field: FieldDef; value: string; stored: boolean; error?: string; onChange: (v: string) => void }> = ({ field, value, stored, error, onChange }) => {
  const id = `field-${field.key}`;
  const isFilled = (value ?? '').trim().length > 0;
  const isSecretStored = field.secret && stored;
  const placeholder = isSecretStored ? '•••••••• (already saved in vault — leave blank to keep)' : field.placeholder;

  return (
    <div className="flex flex-col gap-1.5">
      {field.kind === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm font-medium text-op-fg cursor-pointer">
          <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : '')} className="h-4 w-4 rounded border-op-border-strong text-indigo-600 focus:ring-indigo-500" />
          <span>{field.label}</span>
          {value === 'true' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3 text-emerald-600" /> Enabled
            </span>
          )}
        </label>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-xs font-semibold text-op-muted tracking-wide flex items-center gap-1.5">
              <span>{field.label}</span>
              {field.required && <span className="text-rose-500 font-bold">*</span>}
            </label>
            {isSecretStored ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
                <Lock className="h-3 w-3 text-emerald-600" /> Stored in Vault
              </span>
            ) : isFilled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200 shadow-2xs">
                <Check className="h-3 w-3 text-sky-600" /> Configured
              </span>
            ) : null}
          </div>

          <div className="relative flex items-center">
            {field.kind === 'textarea' ? (
              <textarea
                id={id}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputCls} font-mono text-xs ${isSecretStored && !isFilled ? 'border-emerald-300 bg-emerald-50/15' : isFilled ? 'border-sky-300' : ''}`}
                autoComplete="off"
                spellCheck={false}
              />
            ) : field.kind === 'select' ? (
              <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
                {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <>
                <input
                  id={id}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-error` : undefined}
                  type={field.kind === 'number' ? 'number' : field.kind === 'password' ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className={`${inputCls} ${isSecretStored && !isFilled ? 'border-emerald-300 bg-emerald-50/15 pr-28 font-mono' : isFilled ? 'border-sky-300 pr-10' : ''}`}
                  autoComplete={field.kind === 'password' ? 'new-password' : 'off'}
                  spellCheck={false}
                />
                {isSecretStored && !isFilled && (
                  <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none text-emerald-600 text-xs font-semibold select-none">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-[11px]">Saved</span>
                  </div>
                )}
                {isFilled && (
                  <div className="absolute right-3 flex items-center pointer-events-none text-sky-600 select-none">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      {field.help && <p className="text-[11px] text-op-subtle">{field.help}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
  );
};

export const IntegrationFormModal: React.FC<Props> = ({ projectId, def, existing, onClose, onSaved }) => {
  const [name, setName] = useState(existing?.name ?? `${def.label} integration`);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(def, existing?.config));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<ProjectIntegration | null>(null);

  useEffect(() => {
    setName(existing?.name ?? `${def.label} integration`);
    setValues(initialValues(def, existing?.config));
    setError(null);
    setErrors({});
    setCreated(null);
  }, [def, existing]);

  const stored = existing?.credentialKeys ?? [];
  const visible = useMemo(() => def.fields.filter((f) => isVisible(f, values)), [def, values]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problems = validateFields(def, values, stored);
    const validName = resourceName('Integration name').safeParse(name);
    if (!validName.success) problems.name = validName.error.issues[0].message;
    setErrors(problems);
    if (Object.keys(problems).length) return;
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
      <form id="integration-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-op-subtle">{def.description}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="integration-name" className="text-xs font-semibold text-op-muted tracking-wide">Name <span className="text-rose-500">*</span></label>
          <input id="integration-name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'integration-name-error' : undefined} value={name} onChange={(e) => { setName(e.target.value); setErrors(current => ({ ...current, name: '' })); }} className={inputCls} maxLength={100} />
          {errors.name && <p id="integration-name-error" role="alert" className="text-xs text-rose-600">{errors.name}</p>}
        </div>
        {visible.map((f) => (
          <Field key={f.key} field={f} value={values[f.key] ?? ''} stored={stored.includes(f.key)} error={errors[f.key]} onChange={(v) => { setValues((cur) => ({ ...cur, [f.key]: v })); setErrors(current => ({ ...current, [f.key]: '' })); }} />
        ))}
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <p className="text-[11px] text-op-subtle">Secrets are encrypted at rest and never shown again.</p>
      </form>
    </Modal>
  );
};
