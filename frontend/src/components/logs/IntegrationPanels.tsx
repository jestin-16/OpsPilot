import React, { useState } from 'react';
import { GitCommit, Play, RefreshCw, X, Box, Terminal, Layers, Copy, Check } from 'lucide-react';
import type { ProjectIntegration, ProjectLogEntry } from '../../services/projectApi';
import { formatTime } from './logUtils';

export interface DockerPanelProps {
  integration: ProjectIntegration;
  container: string;
  onContainer: (c: string) => void;
}

export const DockerPanel: React.FC<DockerPanelProps> = ({ integration, container, onContainer }) => {
  const containers = typeof integration.config.containers === 'string'
    ? integration.config.containers.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
      <Box className="h-4 w-4 text-sky-600" />
      <span className="font-semibold text-slate-800">Docker Host:</span>
      <span className="font-mono text-slate-700">{String(integration.config.host || 'Engine API')}</span>

      {containers.length > 0 && (
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-slate-500">Filter container:</span>
          <select
            value={container}
            onChange={(e) => onContainer(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700"
          >
            <option value="">All Containers</option>
            {containers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export interface KubernetesPanelProps {
  integration: ProjectIntegration;
  namespace: string;
  pod: string;
  onNamespace: (ns: string) => void;
  onPod: (pod: string) => void;
  snapshot: boolean;
}

export const KubernetesPanel: React.FC<KubernetesPanelProps> = ({
  integration,
  namespace,
  pod,
  onNamespace,
  onPod,
}) => {
  const configuredNs = String(integration.config.namespace || 'default');

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
      <Layers className="h-4 w-4 text-indigo-600" />
      <span className="font-semibold text-slate-800">Cluster:</span>
      <span className="font-mono text-slate-600 truncate max-w-xs">{String(integration.config.apiServer || '')}</span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-slate-600">
          <span>Namespace:</span>
          <input
            type="text"
            placeholder={configuredNs}
            value={namespace}
            onChange={(e) => onNamespace(e.target.value)}
            className="w-28 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-800"
          />
        </label>
        <label className="flex items-center gap-1 text-slate-600">
          <span>Pod:</span>
          <input
            type="text"
            placeholder="all pods"
            value={pod}
            onChange={(e) => onPod(e.target.value)}
            className="w-28 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-800"
          />
        </label>
      </div>
    </div>
  );
};

export interface AppLogsPanelProps {
  integration: ProjectIntegration;
}

export const AppLogsPanel: React.FC<AppLogsPanelProps> = ({ integration }) => {
  const [copied, setCopied] = useState(false);
  const token = integration.ingestToken;

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-600" />
          <span className="font-semibold text-slate-800">HTTP Ingest Endpoint</span>
        </div>
        {token && (
          <button
            onClick={copyToken}
            className="flex items-center gap-1 rounded bg-white px-2 py-1 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
            {copied ? 'Copied Token' : 'Copy Ingest Token'}
          </button>
        )}
      </div>
      <p className="mt-1 text-slate-500">
        Push JSON log lines to <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800 font-mono">/api/v1/ingest/logs</code> using token authorization.
      </p>
    </div>
  );
};

export interface GitTimelineProps {
  entries: ProjectLogEntry[];
  loading: boolean;
  integration: ProjectIntegration;
}

export const GitTimeline: React.FC<GitTimelineProps> = ({ entries, loading }) => {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No git commit events recorded yet. Connect a GitHub webhook to see push events here.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
        <GitCommit className="h-4 w-4 text-indigo-600" /> Git Activity Timeline
      </h3>
      <div className="divide-y divide-slate-100">
        {entries.map((e) => (
          <div key={e.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
            <div>
              <p className="font-medium text-slate-800">{e.message}</p>
              {e.metadata && Object.keys(e.metadata).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500 font-mono">
                  {e.metadata.author && <span>by {e.metadata.author}</span>}
                  {e.metadata.commit && <span>#{e.metadata.commit.slice(0, 7)}</span>}
                  {e.metadata.ref && <span>branch: {e.metadata.ref}</span>}
                </div>
              )}
            </div>
            <span className="shrink-0 text-slate-400 font-mono text-[11px]">{formatTime(e.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface CicdRunsProps {
  integration: ProjectIntegration;
  entries: ProjectLogEntry[];
}

export const CicdRuns: React.FC<CicdRunsProps> = ({ entries }) => {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
        <Play className="h-4 w-4 text-emerald-600" /> CI/CD Pipeline Runs
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">No workflow or pipeline runs detected yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {entries.map((e) => (
            <div key={e.id} className="py-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-800">{e.message}</span>
              <span className="font-mono text-slate-400 text-[11px]">{formatTime(e.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface SnapshotListProps {
  title: string;
  entries?: ProjectLogEntry[];
  loading: boolean;
  error?: unknown;
  onRefresh: () => void;
  onClose: () => void;
}

export const SnapshotList: React.FC<SnapshotListProps> = ({
  title,
  entries = [],
  loading,
  error,
  onRefresh,
  onClose,
}) => {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 rounded p-1 text-slate-500 hover:bg-slate-100"
            title="Refresh snapshot"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded p-1 text-slate-500 hover:bg-slate-100"
            title="Close snapshot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded bg-slate-100" />
      ) : error ? (
        <div className="text-xs text-rose-600">Failed to load snapshot.</div>
      ) : entries.length === 0 ? (
        <div className="text-xs text-slate-500">No logs found in this snapshot.</div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-1 font-mono text-xs">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start gap-2 py-0.5">
              <span className="text-slate-400 select-none">{formatTime(e.timestamp)}</span>
              <span className="text-slate-800">{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
