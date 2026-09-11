import React, { useEffect, useState } from 'react';
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
import { api, type LogEntry } from '../../services/api';

export const LogsView: React.FC = () => {
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');
  const [searchLog, setSearchLog] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const loadLogs = async () => {
    try {
      setLogs(await api.getLogs({ providerName: 'local' }));
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    loadLogs();
    if (!isStreaming) return;
    const timer = window.setInterval(loadLogs, 5000);
    return () => window.clearInterval(timer);
  }, [isStreaming]);

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = logLevel === 'ALL' || l.logLevel === logLevel;
    const matchesQuery =
      l.message.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.sourceService.toLowerCase().includes(searchLog.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.logLevel}] [${l.sourceService}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <FileText className="w-6 h-6 text-op-accent" /> Centralized Log Stream & Console
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Aggregated log tail across Docker containers, Kubernetes pods, microservices & Jenkins pipelines.
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
                <Pause className="w-3.5 h-3.5 text-op-warn" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-op-success" /> Resume Stream
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-op-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter log text or service..."
            value={searchLog}
            onChange={(e) => setSearchLog(e.target.value)}
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

      {/* Main Terminal Console View */}
      <Card className="p-0 overflow-hidden bg-black/90 border border-op-border shadow-2xl">
        <div className="bg-op-raised/90 px-4 py-2.5 border-b border-op-border flex items-center justify-between font-mono text-xs text-op-subtle">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-op-accent" />
            <span className="text-op-fg font-bold">opspilot-tail -f /var/log/containers/*.log</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-op-success">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-op-success animate-pulse' : 'bg-op-warn'}`} />
              {isStreaming ? 'LIVE STREAMING' : 'PAUSED'}
            </span>
            <span className="text-[11px] text-op-subtle">{filteredLogs.length} events matched</span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs flex flex-col gap-2 max-h-[500px] overflow-y-auto leading-relaxed">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 hover:bg-white/5 p-1 rounded transition-colors group">
              <span className="text-op-subtle text-[11px] select-none">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase select-none ${
                  log.logLevel === 'ERROR'
                    ? 'bg-op-danger/20 text-op-danger border border-op-danger/40'
                    : log.logLevel === 'WARN'
                    ? 'bg-op-warn/20 text-op-warn border border-op-warn/40'
                    : log.logLevel === 'DEBUG'
                    ? 'bg-op-highlight/20 text-op-highlight border border-op-highlight/40'
                    : 'bg-op-accent/20 text-op-accent border border-op-accent/40'
                }`}
              >
                {log.logLevel}
              </span>
              <span className="text-op-accent font-semibold text-[11px]">[{log.sourceService}]</span>
              <span className="text-op-fg flex-1 font-mono">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
