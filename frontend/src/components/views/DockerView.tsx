import React, { useState } from 'react';
import {
  Box,
  Play,
  Square,
  RotateCw,
  Terminal,
  Cpu,
  HardDrive,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

export const DockerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'containers' | 'images'>('containers');
  const [selectedLogsContainer, setSelectedLogsContainer] = useState<string | null>(null);

  const containers = [
    {
      id: 'c-101',
      name: 'opspilot-redis-cache',
      image: 'redis:7.2-alpine',
      status: 'running',
      created: '2 days ago',
      cpu: '1.2%',
      memory: '42 MB / 512 MB',
      ports: '6379:6379',
    },
    {
      id: 'c-102',
      name: 'opspilot-postgres-db',
      image: 'postgres:16-alpine',
      status: 'running',
      created: '5 days ago',
      cpu: '4.8%',
      memory: '210 MB / 2048 MB',
      ports: '5432:5432',
    },
    {
      id: 'c-103',
      name: 'payment-gateway-app',
      image: 'opspilot/payment-gateway:v2.4.0',
      status: 'running',
      created: '10 hours ago',
      cpu: '12.4%',
      memory: '154 MB / 1024 MB',
      ports: '8080:8080',
    },
    {
      id: 'c-104',
      name: 'analytics-worker-daemon',
      image: 'opspilot/analytics-worker:v1.8.0',
      status: 'running',
      created: '1 day ago',
      cpu: '24.1%',
      memory: '412 MB / 1024 MB',
      ports: '9090:9090',
    },
    {
      id: 'c-105',
      name: 'legacy-mock-service',
      image: 'mockserver/mockserver:latest',
      status: 'stopped',
      created: '3 weeks ago',
      cpu: '0%',
      memory: '0 MB / 512 MB',
      ports: '1080:1080',
    },
  ];

  const images = [
    { name: 'opspilot/payment-gateway', tag: 'v2.4.0', size: '142 MB', created: '10 hours ago', id: 'img-901' },
    { name: 'opspilot/auth-service', tag: 'v3.1.2', size: '210 MB', created: '1 day ago', id: 'img-902' },
    { name: 'opspilot/analytics-worker', tag: 'v1.8.0', size: '380 MB', created: '2 days ago', id: 'img-903' },
    { name: 'postgres', tag: '16-alpine', size: '79 MB', created: '2 weeks ago', id: 'img-904' },
    { name: 'redis', tag: '7.2-alpine', size: '35 MB', created: '1 month ago', id: 'img-905' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Box className="w-6 h-6 text-op-accent" /> Docker Engine & Container Management
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Container lifecycle actions, resource utilization stats, local image cache & instant log terminal inspect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'containers' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('containers')}
            className="text-xs py-2 px-3"
          >
            Containers ({containers.length})
          </Button>
          <Button
            variant={activeTab === 'images' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('images')}
            className="text-xs py-2 px-3"
          >
            Image Registry ({images.length})
          </Button>
        </div>
      </div>

      {activeTab === 'containers' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-success/15 text-op-success border border-op-success/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">Running Containers</span>
                <p className="text-xl font-bold text-op-fg">4 Active</p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-accent/15 text-op-accent border border-op-accent/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">Total CPU Allocation</span>
                <p className="text-xl font-bold text-op-fg">42.5% Aggregate</p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-highlight/15 text-op-highlight border border-op-highlight/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">RAM Consumption</span>
                <p className="text-xl font-bold text-op-fg">820 MB / 4.0 GB</p>
              </div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-op-fg">
                <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Container Name</th>
                    <th className="px-4 py-3">Image Tag</th>
                    <th className="px-4 py-3">CPU %</th>
                    <th className="px-4 py-3">RAM</th>
                    <th className="px-4 py-3">Ports</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-op-border">
                  {containers.map((c) => (
                    <tr key={c.id} className="hover:bg-op-raised/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'running' ? 'bg-op-success/15 text-op-success border border-op-success/30' : 'bg-op-subtle/15 text-op-subtle border border-op-border'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'running' ? 'bg-op-success animate-pulse' : 'bg-op-subtle'}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-op-fg">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-op-accent">{c.image}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-op-fg">{c.cpu}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{c.memory}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-op-subtle">{c.ports}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLogsContainer(c.name)}
                            title="Inspect Logs"
                            className="p-1.5 rounded bg-op-raised hover:bg-op-accent/20 text-op-accent border border-op-border transition-all cursor-pointer"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>
                          {c.status === 'running' ? (
                            <button
                              onClick={() => alert(`Stopping ${c.name}...`)}
                              title="Stop Container"
                              className="p-1.5 rounded bg-op-raised hover:bg-op-danger/20 text-op-danger border border-op-border transition-all cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => alert(`Starting ${c.name}...`)}
                              title="Start Container"
                              className="p-1.5 rounded bg-op-raised hover:bg-op-success/20 text-op-success border border-op-border transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => alert(`Restarting ${c.name}...`)}
                            title="Restart Container"
                            className="p-1.5 rounded bg-op-raised hover:bg-op-warn/20 text-op-warn border border-op-border transition-all cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Image Registry Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <Card key={img.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-op-raised text-op-accent border border-op-border">
                    {img.tag}
                  </span>
                  <span className="text-[11px] font-mono text-op-subtle">{img.size}</span>
                </div>
                <h3 className="text-sm font-bold font-mono text-op-fg">{img.name}</h3>
                <p className="text-xs text-op-muted mt-1">Pushed: {img.created}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-op-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-op-subtle">ID: {img.id}</span>
                <Button
                  variant="secondary"
                  onClick={() => alert(`Pulling ${img.name}:${img.tag}...`)}
                  className="text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-op-accent" /> Pull Image
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Terminal Log Modal */}
      {selectedLogsContainer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-op-surface border border-op-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-op-fg flex items-center gap-2">
                <Terminal className="w-4 h-4 text-op-accent" /> Container Logs: {selectedLogsContainer}
              </h3>
              <button
                onClick={() => setSelectedLogsContainer(null)}
                className="text-xs text-op-muted hover:text-op-fg font-bold"
              >
                Close
              </button>
            </div>
            <div className="bg-black/90 p-4 rounded-xl border border-op-border font-mono text-xs text-op-success h-64 overflow-y-auto flex flex-col gap-1 leading-relaxed">
              <span>[2026-07-29T18:30:12Z] INFO  Initializing process manager for {selectedLogsContainer}...</span>
              <span>[2026-07-29T18:30:13Z] INFO  Listening on HTTP endpoint 0.0.0.0:8080</span>
              <span>[2026-07-29T18:35:44Z] DEBUG Healthcheck ping received. Status 200 OK.</span>
              <span>[2026-07-29T18:40:01Z] INFO  Pool connections active: 18 / 50</span>
              <span className="text-op-warn">[2026-07-29T18:42:19Z] WARN High memory usage threshold noticed (&gt; 70%)</span>
              <span className="text-op-accent">[2026-07-29T18:45:00Z] INFO  Autoscaling trigger evaluated. Pod healthy.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
