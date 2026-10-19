import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, Trash2, ArrowDown, Download, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { UseProjectLogs } from '../../hooks/useProjectLogs';
import { LEVEL_STYLES, LEVEL_TEXT } from '../../lib/logBuffer';
import type { ProjectLogEntry } from '../../services/projectApi';

export function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

interface LogViewerProps {
  logs: UseProjectLogs;
  integrationNames?: Map<number, string>;
  className?: string;
  emptyHint?: React.ReactNode;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  integrationNames = new Map(),
  className = 'h-[60vh]',
  emptyHint,
}) => {
  const { entries, status, error, paused, setPaused, pendingCount, droppedCount, clear, retry } = logs;
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when new entries arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current && !paused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll, paused]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  const handleDownload = () => {
    const text = entries
      .map(
        (e) =>
          `[${e.timestamp}] [${e.level}] ${e.sourceType ? `[${e.sourceType}] ` : ''}${e.message}`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opspilot-logs-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl ${className}`}>
      {/* Console Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur">
        {/* Status indicator */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-semibold">
            {status === 'connected' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">Live</span>
              </>
            ) : status === 'loading' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                <span className="text-sky-400">Connecting</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="text-slate-400 capitalize">{status}</span>
              </>
            )}
          </span>

          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">{entries.length} lines</span>

          {droppedCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]" title="Oldest lines discarded to prevent browser slowdown">
              <AlertTriangle className="h-3 w-3" />
              {droppedCount} dropped
            </span>
          )}

          {paused && pendingCount > 0 && (
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300 font-mono text-[11px]">
              +{pendingCount} paused
            </span>
          )}
        </div>

        {/* Actions Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              paused
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={paused ? 'Resume live feed' : 'Pause live feed'}
          >
            {paused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
            {paused ? 'Resume' : 'Pause'}
          </button>

          {/* Follow / Scroll to bottom */}
          <button
            onClick={scrollToBottom}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              autoScroll
                ? 'bg-slate-800 text-slate-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
            title="Follow latest logs"
          >
            <ArrowDown className="h-3 w-3" />
            Bottom
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownload}
            disabled={entries.length === 0}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            title="Download log file"
          >
            <Download className="h-3 w-3" />
          </button>

          {/* Clear View */}
          <button
            onClick={clear}
            disabled={entries.length === 0}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            title="Clear current view"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between border-b border-rose-900/50 bg-rose-950/60 px-4 py-2 text-xs text-rose-300">
          <span>Failed to connect to stream: {error}</span>
          <button onClick={retry} className="font-bold underline hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* Log Content Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs p-3 leading-relaxed space-y-1 select-text scroll-smooth"
      >
        {entries.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-slate-500">
            {emptyHint ? (
              <div className="text-center text-sm">{emptyHint}</div>
            ) : status === 'loading' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span>Waiting for incoming log stream...</span>
              </div>
            ) : (
              <span>No logs found matching the current filters.</span>
            )}
          </div>
        ) : (
          entries.map((entry) => {
            const intName = entry.integrationId ? integrationNames.get(entry.integrationId) : null;
            return (
              <div
                key={entry.id}
                className="group flex items-start gap-2.5 rounded px-2 py-0.5 hover:bg-slate-900/80 transition-colors"
              >
                {/* Timestamp */}
                <span className="shrink-0 select-none text-slate-500 text-[11px] pt-0.5">
                  {formatTime(entry.timestamp)}
                </span>

                {/* Level Tag */}
                <span
                  className={`shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                    entry.level === 'ERROR'
                      ? 'bg-rose-900/40 text-rose-400 border border-rose-800/50'
                      : entry.level === 'WARN'
                      ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50'
                      : entry.level === 'INFO'
                      ? 'bg-sky-900/30 text-sky-400 border border-sky-800/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {entry.level || 'INFO'}
                </span>

                {/* Integration / Source Name Badge */}
                {(intName || entry.sourceType) && (
                  <span className="shrink-0 select-none rounded bg-slate-800/90 px-1.5 py-0.2 text-[10px] text-slate-300">
                    {intName || entry.sourceType}
                  </span>
                )}

                {/* Log Message */}
                <span className={`flex-1 break-all whitespace-pre-wrap ${
                  entry.level === 'ERROR' ? 'text-rose-200 font-medium' : entry.level === 'WARN' ? 'text-amber-200' : 'text-slate-200'
                }`}>
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
