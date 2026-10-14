import type { ProjectLogEntry } from '../services/projectApi';

export const MAX_LOG_LINES = 5000;

export interface LogWindow {
  entries: ProjectLogEntry[];
  /** How many of the oldest lines were discarded to stay under the cap. */
  dropped: number;
}

/**
 * Appends entries in arrival order, skips ones already shown (same id) and drops the oldest lines beyond `cap`.
 * Returns the same window object when nothing changed so React can bail out.
 */
export function appendCapped(window: LogWindow, incoming: ProjectLogEntry[], cap: number = MAX_LOG_LINES): LogWindow {
  if (incoming.length === 0) return window;
  const seen = new Set(window.entries.map((e) => e.id));
  const fresh = incoming.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  if (fresh.length === 0) return window;
  const merged = window.entries.concat(fresh);
  const overflow = Math.max(0, merged.length - cap);
  return { entries: overflow > 0 ? merged.slice(overflow) : merged, dropped: window.dropped + overflow };
}

/** Largest numeric id in a list (ids are database row ids as strings); used as Last-Event-ID. */
export function maxId(entries: ProjectLogEntry[]): string | undefined {
  let max = -1;
  for (const e of entries) {
    const n = Number(e.id);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max >= 0 ? String(max) : undefined;
}

export const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;
export type LogLevel = (typeof LEVELS)[number];

export const LEVEL_STYLES: Record<string, string> = {
  ERROR: 'bg-rose-100 text-rose-700 border-rose-200',
  WARN: 'bg-amber-100 text-amber-700 border-amber-200',
  INFO: 'bg-sky-100 text-sky-700 border-sky-200',
  DEBUG: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const LEVEL_TEXT: Record<string, string> = {
  ERROR: 'text-rose-700',
  WARN: 'text-amber-700',
  INFO: 'text-slate-800',
  DEBUG: 'text-slate-500',
};
