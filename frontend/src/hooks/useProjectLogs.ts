import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appendCapped, maxId, MAX_LOG_LINES, type LogWindow } from '../lib/logBuffer';
import { openLogStream, type StreamStatus } from '../services/logStream';
import { errorMessage, projectApi, type LogQueryFilters, type ProjectLogEntry } from '../services/projectApi';

export type LogsStatus = 'loading' | StreamStatus;

export interface UseProjectLogsOptions {
  projectId: number | null;
  filters: LogQueryFilters;
  /** Only history newer than this many milliseconds is loaded (live entries always arrive). null = no limit. */
  historyWindowMs: number | null;
  historySize?: number;
  maxLines?: number;
}

export interface UseProjectLogs {
  entries: ProjectLogEntry[];
  status: LogsStatus;
  error: string | null;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  /** Entries received while paused, not yet shown. */
  pendingCount: number;
  droppedCount: number;
  clear: () => void;
  retry: () => void;
}

const FLUSH_MS = 100;

/**
 * History first (newest page, shown oldest-to-newest), then a live stream that resumes from the last stored id.
 * Updates are batched so a burst of lines costs one render, memory is capped, and Pause holds new lines back
 * without dropping the connection.
 */
export function useProjectLogs(opts: UseProjectLogsOptions): UseProjectLogs {
  const { projectId, historyWindowMs, historySize = 300, maxLines = MAX_LOG_LINES } = opts;
  const filtersKey = JSON.stringify(opts.filters);
  const filters = useMemo(() => JSON.parse(filtersKey) as LogQueryFilters, [filtersKey]);

  const [windowState, setWindowState] = useState<LogWindow>({ entries: [], dropped: 0 });
  const [status, setStatus] = useState<LogsStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [paused, setPausedState] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const pausedRef = useRef(false);
  const incomingRef = useRef<ProjectLogEntry[]>([]);
  const pendingRef = useRef<ProjectLogEntry[]>([]);

  const flush = useCallback(() => {
    if (pausedRef.current) return;
    const batch = incomingRef.current;
    if (batch.length === 0) return;
    incomingRef.current = [];
    setWindowState((w) => appendCapped(w, batch, maxLines));
  }, [maxLines]);

  const setPaused = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPausedState(value);
    if (!value) {
      incomingRef.current = incomingRef.current.concat(pendingRef.current);
      pendingRef.current = [];
      setPendingCount(0);
      flush();
    }
  }, [flush]);

  const clear = useCallback(() => {
    incomingRef.current = [];
    pendingRef.current = [];
    setPendingCount(0);
    setWindowState((w) => ({ entries: [], dropped: w.dropped }));
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (projectId == null) return;
    let cancelled = false;
    let closeStream: (() => void) | undefined;
    incomingRef.current = [];
    pendingRef.current = [];
    pausedRef.current = false;
    setPausedState(false);
    setPendingCount(0);
    setWindowState({ entries: [], dropped: 0 });
    setStatus('loading');
    setError(null);

    const timer = setInterval(flush, FLUSH_MS);

    (async () => {
      let history: ProjectLogEntry[] = [];
      try {
        const from = historyWindowMs ? new Date(Date.now() - historyWindowMs).toISOString() : undefined;
        const page = await projectApi.queryLogs(projectId, { ...filters, from }, 0, historySize);
        history = [...page.content].reverse();
      } catch (err) {
        if (cancelled) return;
        // History is best effort: the live stream may still work, so keep going and surface the problem.
        setError(errorMessage(err, 'Could not load log history'));
      }
      if (cancelled) return;
      setWindowState(appendCapped({ entries: [], dropped: 0 }, history, maxLines));

      closeStream = openLogStream({
        projectId,
        filters,
        lastEventId: maxId(history),
        onEntries: (batch) => {
          if (pausedRef.current) {
            pendingRef.current = pendingRef.current.concat(batch);
            setPendingCount(pendingRef.current.length);
          } else {
            incomingRef.current = incomingRef.current.concat(batch);
          }
        },
        onStatus: (s, detail) => {
          if (cancelled) return;
          setStatus(s);
          if (s === 'live') setError(null);
          if (s === 'error') setError(detail ?? 'Log stream failed');
        },
      });
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      closeStream?.();
    };
  }, [projectId, filters, historyWindowMs, historySize, maxLines, attempt, flush]);

  return { entries: windowState.entries, status, error, paused, setPaused, pendingCount, droppedCount: windowState.dropped, clear, retry };
}
