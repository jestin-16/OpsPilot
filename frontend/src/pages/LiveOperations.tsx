import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, API_BASE_URL, type LogEntry, type Deployment, type NotificationItem } from '../services/api';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Activity, Server, AlertCircle, AlertTriangle, Terminal, Rocket, Bell, Radio } from 'lucide-react';

type ConnectionStatus = 'LIVE' | 'RECONNECTING' | 'OFFLINE';

export const LiveOperations: React.FC = () => {

  const [connStatus, setConnStatus] = useState<ConnectionStatus>('RECONNECTING');

  const [resources, setResources] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        resourcesData, logsData, eventsData, alertsData,
        incidentsData, deploymentsData, notificationsData
      ] = await Promise.all([
        api.getResources().catch(() => []),
        api.getLogs({ limit: 20 }).catch(() => []),
        api.getEvents().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getAllDeployments().catch(() => []),
        api.getNotifications().catch(() => [])
      ]);

      setResources(resourcesData);
      setLogs(logsData);
      setEvents(eventsData);
      setAlerts(alertsData);
      setIncidents(incidentsData);
      setDeployments(deploymentsData);
      setNotifications(notificationsData);
      
      setConnStatus('LIVE');
    } catch (error) {
      setConnStatus('OFFLINE');
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Controlled refresh every 5 seconds for non-streaming providers
    fetchIntervalRef.current = setInterval(() => {
      fetchAllData();
    }, 5000);

    // Setup SSE for live events
    const setupSSE = () => {
      try {
        const token = localStorage.getItem('opspilot_token');
        const eventSourceUrl = `${API_BASE_URL}/monitoring/live-events/stream${token ? `?token=${token}` : ''}`;
        
        eventSourceRef.current = new EventSource(eventSourceUrl);
        
        eventSourceRef.current.onopen = () => {
          setConnStatus('LIVE');
        };

        eventSourceRef.current.addEventListener('posthog-event', (e) => {
          try {
            const newEvent = JSON.parse(e.data);
            setEvents(prev => [{
              id: `sse-${Date.now()}-${Math.random()}`,
              eventType: newEvent.event,
              message: `Live event: ${newEvent.event}`,
              timestamp: new Date().toISOString(),
              severity: 'INFO',
              provider: 'PostHog'
            }, ...prev].slice(0, 50));
          } catch (err) {
            console.error('Error parsing SSE event', err);
          }
        });

        eventSourceRef.current.onerror = () => {
          setConnStatus('RECONNECTING');
          eventSourceRef.current?.close();
          // Attempt to reconnect SSE after 5 seconds
          setTimeout(setupSSE, 5000);
        };
      } catch (err) {
        console.error('Failed to setup SSE', err);
        setConnStatus('OFFLINE');
      }
    };

    setupSSE();

    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [fetchAllData]);

  // Derived sections
  const healthyCount = resources.filter(r => r.status === 'HEALTHY' || r.status === 'RUNNING' || r.status === 'ACTIVE').length;
  const criticalCount = resources.filter(r => r.status === 'CRITICAL' || r.status === 'FAILED' || r.status === 'STOPPED').length;
  const warningCount = resources.filter(r => r.status === 'WARNING' || r.status === 'DEGRADED').length;

  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED');
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              Live Operations <Radio className={`w-6 h-6 ${connStatus === 'LIVE' ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              Real-time command center for infrastructure, logs, and events.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status:</span>
             <Badge variant={connStatus === 'LIVE' ? 'success' : connStatus === 'RECONNECTING' ? 'warning' : 'error'}>
               {connStatus}
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Resource Health Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-900/30">
                 <div className="flex items-center gap-3 mb-2">
                   <Server className="w-5 h-5 text-green-600 dark:text-green-400" />
                   <h3 className="font-bold text-green-900 dark:text-green-100">Healthy</h3>
                 </div>
                 <p className="text-3xl font-bold text-green-700 dark:text-green-300">{healthyCount}</p>
               </Card>
               <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-900/30">
                 <div className="flex items-center gap-3 mb-2">
                   <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                   <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Warning</h3>
                 </div>
                 <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{warningCount}</p>
               </Card>
               <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-900/30">
                 <div className="flex items-center gap-3 mb-2">
                   <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                   <h3 className="font-bold text-red-900 dark:text-red-100">Critical</h3>
                 </div>
                 <p className="text-3xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
               </Card>
            </div>

            {/* 2 & 3. Live Logs and Events */}
            <Card className="overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <Terminal className="w-5 h-5 text-indigo-500" /> Live Logs & Events
                 </h3>
                 <Badge variant="info">Auto-scrolling</Badge>
               </div>
               <div className="bg-gray-950 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm space-y-2">
                 {[...logs, ...events]
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                   .map((item, idx) => (
                     <div key={`log-evt-${idx}`} className="flex items-start gap-3 border-b border-gray-800 pb-2">
                       <span className="text-gray-500 shrink-0">
                         {new Date(item.timestamp).toLocaleTimeString()}
                       </span>
                       <span className={`shrink-0 font-bold ${
                         item.logLevel === 'ERROR' || item.severity === 'CRITICAL' ? 'text-red-400' :
                         item.logLevel === 'WARN' || item.severity === 'WARNING' ? 'text-yellow-400' :
                         'text-green-400'
                       }`}>
                         [{item.logLevel || item.severity || 'INFO'}]
                       </span>
                       <span className="text-gray-300 break-all">
                         <span className="text-indigo-300 mr-2">
                           {item.sourceService || item.provider || 'system'}:
                         </span>
                         {item.message}
                       </span>
                     </div>
                 ))}
                 {logs.length === 0 && events.length === 0 && (
                   <div className="text-gray-600 italic">Waiting for incoming logs...</div>
                 )}
               </div>
            </Card>

            {/* 6. Recent Deployments */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-indigo-500" /> Live Deployments
              </h3>
              <div className="space-y-3">
                {deployments.slice(0, 5).map(d => (
                  <div key={d.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{d.projectName} - v{d.version}</span>
                      <span className="text-xs text-gray-500">{new Date(d.deployedAt).toLocaleDateString()} • {d.environment}</span>
                    </div>
                    <Badge variant={d.status.toLowerCase() === 'success' || d.status.toLowerCase() === 'running' ? 'success' : d.status.toLowerCase() === 'failed' ? 'error' : 'warning'}>
                      {d.status}
                    </Badge>
                  </div>
                ))}
                {deployments.length === 0 && (
                  <p className="text-sm text-gray-500">No recent deployments.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 4. Active Alerts */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500" /> Active Alerts
                {activeAlerts.length > 0 && <Badge variant="warning">{activeAlerts.length}</Badge>}
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {activeAlerts.map(a => (
                  <div key={a.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                    <p className="font-bold text-sm text-yellow-800 dark:text-yellow-200">{a.ruleName}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{a.resourceName} • {a.provider}</p>
                  </div>
                ))}
                {activeAlerts.length === 0 && (
                  <p className="text-sm text-gray-500">No active alerts.</p>
                )}
              </div>
            </Card>

            {/* 5. Active Incidents */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" /> Active Incidents
                {activeIncidents.length > 0 && <Badge variant="error">{activeIncidents.length}</Badge>}
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {activeIncidents.map(i => (
                  <div key={i.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                    <p className="font-bold text-sm text-red-800 dark:text-red-200">{i.title}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Severity: {i.severity} • Started: {new Date(i.startedAt).toLocaleTimeString()}</p>
                  </div>
                ))}
                {activeIncidents.length === 0 && (
                  <p className="text-sm text-gray-500">No active incidents.</p>
                )}
              </div>
            </Card>

            {/* 7. Notification Activity */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-indigo-500" /> Notifications
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {notifications.slice(0, 10).map(n => (
                  <div key={n.notificationId} className="flex gap-3 items-start border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0">
                    <div className="mt-1">
                      {n.read ? <Activity className="w-4 h-4 text-gray-400" /> : <div className="w-2 h-2 mt-1 rounded-full bg-indigo-500"></div>}
                    </div>
                    <div>
                      <p className={`text-sm ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-gray-500">No notifications.</p>
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
