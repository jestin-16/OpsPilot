import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  api,
  type WatcherPodSummary,
  type ParsedWatcherLogLine
} from '../../services/api';
import {
  Play,
  Pause,
  ArrowDown,
  Trash2,
  Download,
  Search,
  RefreshCw,
  WifiOff,
  Filter,
  Terminal
} from 'lucide-react';

interface LogViewerProps {
  initialPod?: string;
  initialNamespace?: string;
  initialContainer?: string;
}

type ConnectionState = 'connected' | 'reconnecting' | 'lost';

const ROW_HEIGHT = 28;
const OVERSCAN = 15;

export const LogViewer: React.FC<LogViewerProps> = ({
  initialPod,
  initialNamespace = 'default',
  initialContainer = 'ALL'
}) => {
  // Pod and Container selection
  const [pods, setPods] = useState<WatcherPodSummary[]>([]);
  const [watcherMessage, setWatcherMessage] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>(initialNamespace);
  const [selectedPod, setSelectedPod] = useState<string>(initialPod || '');
  const [selectedContainer, setSelectedContainer] = useState<string>(initialContainer);

  // Log entries and streaming state
  const [logs, setLogs] = useState<ParsedWatcherLogLine[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('reconnecting');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // Filters & Search
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRegex, setIsRegex] = useState<boolean>(false);

  // Virtualization refs
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(600);
  const userScrolledUpRef = useRef<boolean>(false);

  // SSE EventSource reference
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch available pods for selector
  const fetchPods = useCallback(async () => {
    try {
      const [data, watcherStatus] = await Promise.all([api.getWatcherPods(), api.getWatcherStatus()]);
      setPods(data);
      const isDis = watcherStatus.enabled === false || watcherStatus.message?.toLowerCase().includes('disabled');
      setWatcherMessage(watcherStatus.connected || isDis ? '' : watcherStatus.message);
      if (data.length > 0 && !selectedPod) {
        setSelectedPod(data[0].name);
        setSelectedNamespace(data[0].namespace);
        setSelectedContainer(data[0].containers?.[0] || 'ALL');
      }
    } catch (err) {
      console.error('Failed to load pods for LogViewer:', err);
      setWatcherMessage('Could not reach the Pod Log service. Check that log-watcher-service is running.');
    }
  }, [selectedPod]);

  useEffect(() => {
    fetchPods();
    const interval = setInterval(fetchPods, 10000);
    return () => clearInterval(interval);
  }, [fetchPods]);

  // Update selected container list when pod changes
  const activePodObj = useMemo(() => {
    return pods.find(p => p.name === selectedPod && p.namespace === selectedNamespace);
  }, [pods, selectedPod, selectedNamespace]);

  const availableContainers = useMemo(() => {
    if (!activePodObj || !activePodObj.containers) return [];
    return activePodObj.containers;
  }, [activePodObj]);

  // 2. Setup SSE Log Streaming with auto-reconnect & exponential backoff
  const connectSSE = useCallback(() => {
    if (!selectedPod || !selectedNamespace) return;

    // Cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionState('reconnecting');

    const streamUrl = api.getWatcherStreamUrl(
      selectedNamespace,
      selectedPod,
      selectedContainer !== 'ALL' ? selectedContainer : undefined,
      100 // initial tail
    );

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('open', () => {
      setConnectionState('connected');
      setReconnectAttempts(0);
    });

    es.addEventListener('CONNECTED', () => {
      setConnectionState('connected');
      setReconnectAttempts(0);
    });

    es.addEventListener('LOG', (e: MessageEvent) => {
      if (isPaused) return; // If paused, don't append to active logs

      try {
        const parsedLog: ParsedWatcherLogLine = JSON.parse(e.data);
        setLogs(prev => {
          // Bounded in UI memory: maximum 10,000 lines
          if (prev.length >= 10000) {
            return [...prev.slice(prev.length - 9000), parsedLog];
          }
          return [...prev, parsedLog];
        });
      } catch (err) {
        console.error('Failed to parse incoming SSE log:', err);
      }
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setConnectionState('reconnecting');

      // Exponential backoff reconnect
      setReconnectAttempts(prev => {
        const nextAttempt = prev + 1;
        if (nextAttempt > 10) {
          setConnectionState('lost');
          return nextAttempt;
        }

        const delay = Math.min(30000, 1000 * Math.pow(1.8, nextAttempt));
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isFollowing) {
            connectSSE();
          }
        }, delay);

        return nextAttempt;
      });
    };
  }, [selectedNamespace, selectedPod, selectedContainer, isFollowing, isPaused]);

  useEffect(() => {
    if (isFollowing && selectedPod) {
      connectSSE();
    } else if (!isFollowing && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [selectedPod, selectedNamespace, selectedContainer, isFollowing, connectSSE]);

  // 3. Filter and search logs
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (levelFilter !== 'ALL') {
      result = result.filter(l => l.level?.toUpperCase() === levelFilter);
    }

    if (selectedContainer !== 'ALL') {
      result = result.filter(l => l.container === selectedContainer);
    }

    if (searchQuery.trim()) {
      if (isRegex) {
        try {
          const reg = new RegExp(searchQuery, 'i');
          result = result.filter(l => reg.test(l.message) || reg.test(l.raw || ''));
        } catch {
          // If invalid regex, fallback to substring match
          result = result.filter(l => l.message.toLowerCase().includes(searchQuery.toLowerCase()));
        }
      } else {
        const q = searchQuery.toLowerCase();
        result = result.filter(l => l.message.toLowerCase().includes(q) || (l.raw && l.raw.toLowerCase().includes(q)));
      }
    }

    return result;
  }, [logs, levelFilter, selectedContainer, searchQuery, isRegex]);

  // 4. Measure viewport height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (viewportRef.current) {
        setViewportHeight(viewportRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 5. Auto-scroll to bottom if enabled and not user-scrolled-up
  useEffect(() => {
    if (autoScroll && !userScrolledUpRef.current && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  // Handle scroll events for virtualization & auto-scroll detection
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    userScrolledUpRef.current = !isNearBottom;
    if (isNearBottom && !autoScroll) {
      setAutoScroll(true);
    } else if (!isNearBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  // Virtualization slice calculation
  const totalItems = filteredLogs.length;
  const totalHeight = totalItems * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalItems, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleItems = filteredLogs.slice(startIndex, endIndex);

  // 6. Action handlers
  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    if (logs.length === 0) return;
    const header = `# OpsPilot Kubernetes Log Export\n# Pod: ${selectedNamespace}/${selectedPod}\n# Container: ${selectedContainer}\n# Exported At: ${new Date().toISOString()}\n# Total Lines: ${logs.length}\n\n`;
    const content = header + logs.map(l => `[${l.timestamp}] [${l.level}] [${l.container}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPod || 'k8s'}-logs-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: string) => {
    const lvl = (level || 'INFO').toUpperCase();
    switch (lvl) {
      case 'ERROR':
      case 'FATAL':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">ERR</span>;
      case 'WARN':
      case 'WARNING':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">WRN</span>;
      case 'DEBUG':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">DBG</span>;
      case 'TRACE':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">TRC</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">INF</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0D13] text-slate-100 rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono">
      {/* Top Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#11141E] border-b border-white/10 text-xs">
        {/* Left: Pod & Container Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">Pod:</span>
            <select
              value={selectedPod}
              onChange={(e) => {
                setSelectedPod(e.target.value);
                const pod = pods.find(p => p.name === e.target.value);
                if (pod) {
                  setSelectedNamespace(pod.namespace);
                  setSelectedContainer(pod.containers?.[0] || 'ALL');
                }
                setLogs([]);
              }}
              className="bg-transparent border-none text-emerald-400 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {pods.map(p => (
                <option key={`${p.namespace}/${p.name}`} value={p.name} className="bg-[#11141E] text-slate-200">
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            <span className="text-slate-400">Container:</span>
            <select
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value)}
              className="bg-transparent border-none text-cyan-400 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL" className="bg-[#11141E] text-slate-200">ALL</option>
              {availableContainers.map(c => (
                <option key={c} value={c} className="bg-[#11141E] text-slate-200">{c}</option>
              ))}
            </select>
          </div>

          {/* Connection State Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-sans">
            {connectionState === 'connected' && (
              <span className="flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            )}
            {connectionState === 'reconnecting' && (
              <span className="flex items-center gap-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Reconnecting ({reconnectAttempts})
              </span>
            )}
            {connectionState === 'lost' && (
              <button
                onClick={connectSSE}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                title="Click to reconnect"
              >
                <WifiOff className="w-3 h-3" />
                Disconnected (Retry)
              </button>
            )}
          </div>
          {watcherMessage && (
            <span role="status" className="max-w-[340px] text-[11px] text-amber-300" title={watcherMessage}>
              {watcherMessage}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Live Follow Toggle */}
          <button
            onClick={() => setIsFollowing(f => !f)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-sans transition-colors ${
              isFollowing
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
            title={isFollowing ? "Stop following stream" : "Start following stream"}
          >
            <span>{isFollowing ? 'Following' : 'Follow'}</span>
          </button>

          {/* Follow / Pause Toggle */}
          <button
            onClick={() => setIsPaused(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-sans transition-colors ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={isPaused ? "Resume Live Stream" : "Pause Live Stream"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => {
              setAutoScroll(a => !a);
              if (!autoScroll && viewportRef.current) {
                userScrolledUpRef.current = false;
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-sans transition-colors ${
              autoScroll
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
            title="Auto-scroll to newest line"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Auto-scroll</span>
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownload}
            disabled={logs.length === 0}
            className="p-1.5 rounded border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
            title="Download Logs as .txt"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded border border-white/10 bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-colors"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Second Toolbar: Search & Level Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#0E1119] border-b border-white/5 text-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs... (case-insensitive)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151926] border border-white/10 rounded-md pl-8 pr-16 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => setIsRegex(r => !r)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                isRegex ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' : 'bg-transparent text-slate-500 border-white/10'
              }`}
              title="Toggle Regex mode"
            >
              .*
            </button>
          </div>
          {searchQuery && (
            <span className="text-[11px] text-slate-400 shrink-0">
              {filteredLogs.length} matches
            </span>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 text-[11px] font-sans">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2 py-0.5 rounded transition-colors ${
                levelFilter === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Total lines count */}
        <div className="text-[11px] text-slate-400 font-mono">
          <span>{filteredLogs.length}</span>
          <span className="text-slate-600"> / {logs.length} lines</span>
        </div>
      </div>

      {/* Virtualized Log Display Window */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#07090E] p-2 relative select-text"
        style={{ minHeight: '380px' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 font-sans">
            <Terminal className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
            <p className="text-sm font-medium">No log entries found</p>
            <p className="text-xs text-slate-600 mt-1">
              {isPaused ? 'Streaming is paused.' : 'Waiting for incoming Kubernetes container output...'}
            </p>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
            <div
              style={{
                transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleItems.map((log, index) => {
                const actualIndex = startIndex + index;
                const isError = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';

                return (
                  <div
                    key={`${actualIndex}-${log.timestamp}`}
                    className={`flex items-center gap-2.5 px-2 text-[12px] leading-[28px] h-[28px] whitespace-nowrap overflow-hidden text-ellipsis border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors ${
                      isError ? 'bg-rose-950/20 text-rose-200' : isWarn ? 'bg-amber-950/20 text-amber-200' : 'text-slate-300'
                    }`}
                  >
                    {/* Timestamp */}
                    <span className="text-slate-500 text-[11px] shrink-0 font-mono select-none">
                      {log.timestamp ? log.timestamp.split('T')[1]?.replace('Z', '') || log.timestamp : '-'}
                    </span>

                    {/* Level */}
                    <span className="shrink-0">{getLevelBadge(log.level)}</span>

                    {/* Container badge */}
                    <span className="text-cyan-400/80 text-[11px] shrink-0 max-w-[100px] truncate select-none">
                      [{log.container}]
                    </span>

                    {/* Log Message */}
                    <span className="font-mono text-slate-200 truncate flex-1" title={log.message}>
                      {log.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B0D13] border-t border-white/5 text-[11px] text-slate-500 font-sans">
        <div className="flex items-center gap-3">
          <span>Namespace: <strong className="text-slate-400 font-mono">{selectedNamespace}</strong></span>
          <span>Pod: <strong className="text-slate-400 font-mono">{selectedPod || 'None'}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Buffer: <strong className="text-emerald-400 font-mono">{logs.length}</strong> / 10,000</span>
          <span>•</span>
          <span>Rendering: <strong className="text-cyan-400 font-mono">{visibleItems.length}</strong> DOM nodes</span>
        </div>
      </div>
    </div>
  );
};
