import React from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import type { LogQueryFilters, ProjectIntegration } from '../../services/projectApi';

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

interface LogFilterBarProps {
  value: LogFilterState;
  onChange: (next: LogFilterState) => void;
  integrations?: ProjectIntegration[];
  hideIntegration?: boolean;
}

const TIME_RANGES: Array<{ label: string; ms: number | null }> = [
  { label: 'Last 5m', ms: 5 * 60 * 1000 },
  { label: 'Last 15m', ms: 15 * 60 * 1000 },
  { label: 'Last 1h', ms: 60 * 60 * 1000 },
  { label: 'Last 24h', ms: 24 * 60 * 60 * 1000 },
  { label: 'All Time', ms: null },
];

const LOG_LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

export const LogFilterBar: React.FC<LogFilterBarProps> = ({
  value,
  onChange,
  integrations = [],
  hideIntegration = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* Search Bar */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter logs by message or keyword..."
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Integration Selector */}
      {!hideIntegration && integrations.length > 0 && (
        <select
          value={value.integrationId ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              integrationId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
        >
          <option value="">All Integrations</option>
          {integrations.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.provider})
            </option>
          ))}
        </select>
      )}

      {/* Log Level Selector */}
      <div className="flex items-center gap-1">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={value.level}
          onChange={(e) => onChange({ ...value, level: e.target.value })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
        >
          {LOG_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl === 'ALL' ? 'All Levels' : lvl}
            </option>
          ))}
        </select>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-slate-400" />
        <select
          value={value.rangeMs === null ? 'null' : String(value.rangeMs)}
          onChange={(e) =>
            onChange({
              ...value,
              rangeMs: e.target.value === 'null' ? null : Number(e.target.value),
            })
          }
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
        >
          {TIME_RANGES.map((r) => (
            <option key={r.label} value={r.ms === null ? 'null' : String(r.ms)}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
