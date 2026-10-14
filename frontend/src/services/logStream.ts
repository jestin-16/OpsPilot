import { API_BASE_URL, api } from './api';
import { SseParser, backoffDelay } from '../lib/sse';
import type { LogQueryFilters, ProjectLogEntry } from './projectApi';

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'error';

export interface OpenLogStreamOptions {
  projectId: number;
  filters: LogQueryFilters;
  /** Resume point: the server replays anything stored after this id before going live. */
  lastEventId?: string;
  onEntries: (entries: ProjectLogEntry[]) => void;
  onStatus: (status: StreamStatus, detail?: string) => void;
}

/** If nothing (not even a keepalive comment) arrives for this long, the connection is considered dead. */
export const STALL_TIMEOUT_MS = 45_000;

class AuthError extends Error {}

function streamUrl(projectId: number, filters: LogQueryFilters): string {
  const params = new URLSearchParams();
  const { integrationId, type, level, q, container, namespace, pod } = filters;
  const values: Record<string, string | number | undefined> = { integrationId, type, level, q, container, namespace, pod };
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== '' && v !== 'ALL') params.set(k, String(v));
  }
  const qs = params.toString();
  return `${API_BASE_URL}/projects/${projectId}/logs/stream${qs ? `?${qs}` : ''}`;
}

/**
 * Server-sent events over fetch (EventSource cannot send the Authorization header). Reconnects with exponential
 * backoff, resuming from the last received id, and refreshes the access token once on 401. Returns a function that
 * closes the stream.
 */
export function openLogStream(opts: OpenLogStreamOptions): () => void {
  const controller = new AbortController();
  let lastId = opts.lastEventId;
  let attempt = 0;
  let refreshed = false;

  const run = async () => {
    while (!controller.signal.aborted) {
      opts.onStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      const attemptController = new AbortController();
      const abortAttempt = () => attemptController.abort();
      controller.signal.addEventListener('abort', abortAttempt, { once: true });
      let stall: ReturnType<typeof setTimeout> | undefined;
      const armStall = () => {
        clearTimeout(stall);
        stall = setTimeout(() => attemptController.abort(), STALL_TIMEOUT_MS);
      };
      try {
        const headers: Record<string, string> = { Accept: 'text/event-stream' };
        const token = localStorage.getItem('opspilot_token');
        if (token) headers.Authorization = `Bearer ${token}`;
        if (lastId) headers['Last-Event-ID'] = lastId;

        armStall();
        const res = await fetch(streamUrl(opts.projectId, opts.filters), { headers, signal: attemptController.signal, credentials: 'include' });
        if (res.status === 401 || res.status === 403) throw new AuthError(String(res.status));
        if (!res.ok || !res.body) throw new Error(`Stream failed (HTTP ${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const parser = new SseParser();
        attempt = 0;
        refreshed = false;
        opts.onStatus('live');
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          armStall();
          const batch: ProjectLogEntry[] = [];
          for (const m of parser.push(decoder.decode(value, { stream: true }))) {
            if (m.event !== 'log') continue;
            try {
              batch.push(JSON.parse(m.data) as ProjectLogEntry);
              if (m.id) lastId = m.id;
            } catch {
              // a malformed event must not take the stream down
            }
          }
          if (batch.length) opts.onEntries(batch);
        }
      } catch (err) {
        if (controller.signal.aborted) break;
        if (err instanceof AuthError) {
          if (!refreshed) {
            refreshed = true;
            try {
              const session = await api.refreshSession();
              localStorage.setItem('opspilot_token', session.token);
              continue; // retry immediately with the new token
            } catch {
              // fall through to the error state
            }
          }
          opts.onStatus('error', 'Your session expired or you do not have access to this project.');
          break;
        }
        // network error, stall abort or server restart: fall through to backoff
      } finally {
        clearTimeout(stall);
        controller.signal.removeEventListener('abort', abortAttempt);
      }
      if (controller.signal.aborted) break;
      opts.onStatus('reconnecting');
      await new Promise((resolve) => setTimeout(resolve, backoffDelay(attempt++)));
    }
  };

  void run();
  return () => controller.abort();
}
