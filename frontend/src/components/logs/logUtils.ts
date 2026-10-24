import type { LogQueryFilters } from '../../services/projectApi';

export function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export interface LogFilterState {
  level: string;
  q: string;
  rangeMs: number | null;
  integrationId?: number;
}

export const DEFAULT_FILTERS: LogFilterState = {
  level: 'ALL',
  q: '',
  rangeMs: 15 * 60 * 1000,
  integrationId: undefined,
};

export function toQueryFilters(
  state: LogFilterState,
  extra?: { container?: string; pod?: string }
): LogQueryFilters {
  return {
    integrationId: state.integrationId,
    level: state.level === 'ALL' ? undefined : state.level,
    q: state.q.trim() || undefined,
    container: extra?.container,
    pod: extra?.pod,
  };
}
