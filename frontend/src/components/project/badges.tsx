import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, PlugZap, XCircle } from 'lucide-react';
import { BADGE_COLORS, TYPE_BY_KEY } from '../../lib/integrationTypes';
import type { IntegrationStatus } from '../../services/projectApi';

const STATUS: Record<IntegrationStatus, { label: string; cls: string; Icon: typeof CheckCircle2; spin?: boolean }> = {
  CONNECTED: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  CONNECTING: { label: 'Not tested', cls: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Loader2, spin: true },
  DEGRADED: { label: 'Degraded', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertCircle },
  ERROR: { label: 'Error', cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle },
  DISCONNECTED: { label: 'Disconnected', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: PlugZap },
};

export const StatusPill: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
  const s = STATUS[status] ?? STATUS.DISCONNECTED;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      <s.Icon className={`h-3.5 w-3.5 ${s.spin ? 'animate-spin' : ''}`} aria-hidden="true" />
      {s.label}
    </span>
  );
};

/** Colored label for where a log line came from, e.g. "Docker · web". */
export const SourceBadge: React.FC<{ type?: string | null; detail?: string; className?: string }> = ({ type, detail, className = '' }) => {
  const def = type ? TYPE_BY_KEY[type] : undefined;
  const color = def ? BADGE_COLORS[def.color] : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color} ${className}`} title={detail ? `${def?.label ?? type} · ${detail}` : def?.label ?? type ?? ''}>
      <span>{def?.label ?? type ?? 'Unknown'}</span>
      {detail && <span className="truncate font-semibold normal-case tracking-normal opacity-80">· {detail}</span>}
    </span>
  );
};
