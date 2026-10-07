import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Play,
  Pause,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  api,
  type DockerSource,
  type LogLevelName,
  type LogQueryEntry,
  type Project,
} from '../../services/api';

const RANGES = [
  { label: '15m', ms: 15 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '6h', ms: 6 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
] as const;

const POLL_MS = 5000;

const selectClass =
  'bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong px-2.5 py-2 outline-none focus:border-op-accent transition-colors';

const errorMessage = (e: unknown): string => {
  const err = e as { response?: { status?: number; data?: { message?: string } } };
  if (err.response?.status === 503) return 'Log store is not enabled on the server.';
  if (err.response?.status === 502) return 'Log store is unreachable. Retrying...';
  return err.response?.data?.message || 'Failed to load logs.';
};

export const LogsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sources, setSources] = useState<DockerSource[] | null>(null);
  const [projectId, setProjectId] = useState('');
  const [environment, setEnvironment] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [container, setContainer] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | LogLevelName>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [rangeMs, setRangeMs] = useState<number>(RANGES[1].ms);
  const [isStreaming, setIsStreaming] = useState(true);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogQueryEntry[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [knownContainers, setKnownContainers] = useState<string[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => setProjects([]));
    api.getDockerSources().then(setSources).catch(() => setSources([]));
  }, []);

  // Debounce free-text so each keystroke does not hit Loki.
  useEffect(() => {
    const t = window.setTimeout(() => setSearchText(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const scopedSources = useMemo(
    () => (sources ?? []).filter((s) => !projectId || s.projectId === Number(projectId)),
    [sources, projectId],
  );
  const environments = useMemo(
    () => Array.from(new Set(scopedSources.map((s) => s.environment))).sort(),
    [scopedSources],
  );
  const projectOptions = useMemo(() => {
    const ids = new Set((sources ?? []).map((s) => s.projectId));
    return projects.filter((p) => ids.has(p.id));
  }, [projects, sources]);

  // Reset dependent filters when the parent filter changes.
  useEffect(() => {
    setEnvironment('');
    setSourceId('');
    setContainer('');
    setKnownContainers([]);
  }, [projectId]);

  const loadLogs = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const to = new Date();
      const res = await api.queryLogs({
        project: projectId ? Number(projectId) : undefined,
        environment: environment || undefined,
        source: sourceId || undefined,
        container: container || undefined,
        level: logLevel === 'ALL' ? undefined : logLevel,
        text: searchText || undefined,
        from: new Date(to.getTime() - rangeMs).toISOString(),
        to: to.toISOString(),
        limit: 500,
      });
      if (id !== requestId.current) return; // a newer request superseded this one
      setLogs(res.entries);
      setTruncated(res.truncated);
      setError(null);
      setKnownContainers((prev) => {
        const next = new Set(prev);
        res.entries.forEach((e) => next.add(e.container));
        return next.size === prev.length ? prev : Array.from(next).sort();
      });
    } catch (e) {
      if (id !== requestId.current) return;
      setError(errorMessage(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [projectId, environment, sourceId, container, logLevel, searchText, rangeMs]);

  useEffect(() => {
    setLoading(true);
    loadLogs();
    if (!isStreaming) return;
    const timer = window.setInterval(loadLogs, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadLogs, isStreaming]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] [${l.container}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const noSources = sources !== null && sources.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <FileText className="w-6 h-6 text-op-accent" /> Docker Container Logs
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Logs pushed by your agents to OpsPilot, scoped to the projects you can access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsStreaming(!isStreaming)}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-op-warn" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-op-success" /> Resume
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleCopyLogs}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-op-success" /> : <Copy className="w-3.5 h-3.5 text-op-accent" />}
            {copied ? 'Copied!' : 'Copy Logs'}
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Project" className={selectClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
          <select aria-label="Environment" className={selectClass} value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="">All environments</option>
            {environments.map((env) => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>
          <select aria-label="Source" className={selectClass} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">All sources</option>
            {scopedSources
              .filter((s) => !environment || s.environment === environment)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
          <select aria-label="Container" className={selectClass} value={container} onChange={(e) => setContainer(e.target.value)}>
            <option value="">All containers</option>
            {Array.from(new Set([...knownContainers, ...(container ? [container] : [])])).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Time range"
            className={selectClass}
            value={rangeMs}
            onChange={(e) => setRangeMs(Number(e.target.value))}
          >
            {RANGES.map((r) => (
              <option key={r.label} value={r.ms}>Last {r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-op-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search log text..."
              maxLength={200}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong pl-9 pr-3 py-2 outline-none focus:border-op-accent transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-op-subtle font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLogLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  logLevel === lvl
                    ? 'bg-op-accent text-op-accent-fg shadow-sm'
                    : 'bg-op-surface text-op-muted hover:text-op-fg border border-op-border'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Terminal Console View */}
      <Card className="p-0 overflow-hidden bg-black/90 border border-op-border shadow-2xl">
        <div className="bg-op-raised/90 px-4 py-2.5 border-b border-op-border flex items-center justify-between font-mono text-xs text-op-subtle">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-op-accent" />
            <span className="text-op-fg font-bold">container logs</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-op-success">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-op-success animate-pulse' : 'bg-op-warn'}`} />
              {isStreaming ? 'LIVE (5s)' : 'PAUSED'}
            </span>
            <span className="text-[11px] text-op-subtle">
              {logs.length} events{truncated ? ' (limit reached, narrow filters)' : ''}
            </span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs flex flex-col gap-2 max-h-[500px] overflow-y-auto leading-relaxed">
          {error && <div className="text-op-danger">{error}</div>}
          {!error && noSources && (
            <div className="text-op-muted">
              No Docker sources yet. Create one under Settings, run the generated agent next to Docker, and logs will appear here.
            </div>
          )}
          {!error && !noSources && !loading && logs.length === 0 && (
            <div className="text-op-muted">No log lines match these filters in the selected time range.</div>
          )}
          {logs.map((log, i) => (
            <div key={`${log.sourceId}-${log.container}-${log.tsNanos}-${i}`} className="flex items-start gap-2.5 hover:bg-white/5 p-1 rounded transition-colors group">
              <span className="text-op-subtle text-[11px] select-none whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase select-none ${
                  log.level === 'ERROR'
                    ? 'bg-op-danger/20 text-op-danger border border-op-danger/40'
                    : log.level === 'WARN'
                    ? 'bg-op-warn/20 text-op-warn border border-op-warn/40'
                    : log.level === 'DEBUG'
                    ? 'bg-op-highlight/20 text-op-highlight border border-op-highlight/40'
                    : 'bg-op-accent/20 text-op-accent border border-op-accent/40'
                }`}
              >
                {log.level}
              </span>
              <span className="text-op-accent font-semibold text-[11px]" title={`${log.sourceName} / ${log.environment}`}>
                [{log.container}]
              </span>
              <span className="text-op-fg flex-1 font-mono whitespace-pre-wrap break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
