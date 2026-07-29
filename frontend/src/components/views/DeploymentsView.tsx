import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Filter,
  Layers,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

export const DeploymentsView: React.FC = () => {
  const [activeEnv, setActiveEnv] = useState<'all' | 'production-us-east' | 'staging-eu-west' | 'dev-local'>('all');
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const activePipelines = [
    {
      id: 'pipe-1',
      service: 'payment-gateway',
      version: 'v2.4.1',
      target: 'production-us-east',
      author: 'Alex Mercer',
      currentStage: 3, // 1: Checkout, 2: Docker Build, 3: K8s Deploy, 4: Verify
      status: 'in_progress',
      started: '3 mins ago',
    },
    {
      id: 'pipe-2',
      service: 'analytics-worker',
      version: 'v1.8.0-rc2',
      target: 'staging-eu-west',
      author: 'Marcus Vance',
      currentStage: 2,
      status: 'in_progress',
      started: '1 min ago',
    },
  ];

  const deploymentHistory = [
    {
      id: 'dep-482',
      service: 'payment-gateway',
      version: 'v2.4.0',
      environment: 'production-us-east',
      status: 'success',
      duration: '2m 14s',
      timestamp: '10 mins ago',
      deployedBy: 'Alex Mercer',
      commitHash: 'a8f4b21',
    },
    {
      id: 'dep-481',
      service: 'auth-service',
      version: 'v3.1.2',
      environment: 'production-us-east',
      status: 'success',
      duration: '1m 58s',
      timestamp: '45 mins ago',
      deployedBy: 'Sarah Chen',
      commitHash: 'c901e3a',
    },
    {
      id: 'dep-480',
      service: 'auth-service',
      version: 'v3.1.1-bad',
      environment: 'production-us-east',
      status: 'failed',
      duration: '45s',
      timestamp: '2 hours ago',
      deployedBy: 'Jenkins CI',
      commitHash: 'f440a1b',
    },
    {
      id: 'dep-479',
      service: 'billing-service',
      version: 'v1.0.4',
      environment: 'staging-eu-west',
      status: 'success',
      duration: '3m 02s',
      timestamp: '3 hours ago',
      deployedBy: 'Alex Mercer',
      commitHash: 'd77810e',
    },
    {
      id: 'dep-478',
      service: 'opspilot-brain',
      version: 'v0.9.5',
      environment: 'production-us-east',
      status: 'success',
      duration: '4m 12s',
      timestamp: '5 hours ago',
      deployedBy: 'OpsPilot AI',
      commitHash: 'e332c90',
    },
  ];

  const filteredHistory = deploymentHistory.filter(
    (d) => activeEnv === 'all' || d.environment === activeEnv
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Rocket className="w-6 h-6 text-op-accent" /> Deployment Orchestration & Pipelines
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Real-time pipeline execution, rolling update tracking, environment matrix & instant rollback support.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsDeployModalOpen(true)}
          className="text-xs py-2.5 px-4 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Play className="w-4 h-4" /> Trigger New Deployment
        </Button>
      </div>

      {/* Active Pipeline Executions Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-op-fg flex items-center gap-2">
          <Layers className="w-4 h-4 text-op-accent" /> Active Pipeline Executions ({activePipelines.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {activePipelines.map((pipe) => (
            <Card key={pipe.id} className="border-l-4 border-l-op-accent bg-op-surface/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-op-accent/15 text-op-accent border border-op-accent/30 animate-pulse">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-op-fg">{pipe.service}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-op-input text-op-accent border border-op-border">
                        {pipe.version}
                      </span>
                    </div>
                    <p className="text-xs text-op-muted mt-0.5">
                      Target: <strong className="text-op-fg">{pipe.target}</strong> • Triggered by {pipe.author} ({pipe.started})
                    </p>
                  </div>
                </div>

                {/* Pipeline Stage Bar */}
                <div className="flex-1 max-w-lg">
                  <div className="flex items-center justify-between text-[11px] font-mono text-op-subtle mb-1.5">
                    <span className={pipe.currentStage >= 1 ? 'text-op-accent font-bold' : ''}>1. Checkout</span>
                    <span className={pipe.currentStage >= 2 ? 'text-op-accent font-bold' : ''}>2. Docker Build</span>
                    <span className={pipe.currentStage >= 3 ? 'text-op-accent font-bold' : ''}>3. K8s Deploy</span>
                    <span className={pipe.currentStage >= 4 ? 'text-op-accent font-bold' : ''}>4. Healthcheck</span>
                  </div>
                  <div className="w-full bg-op-input h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-op-accent h-full transition-all duration-500 animate-pulse"
                      style={{ width: `${(pipe.currentStage / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-op-fg">Deployment Audit Trail</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-op-subtle" />
            <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
              {(['all', 'production-us-east', 'staging-eu-west'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setActiveEnv(env)}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    activeEnv === env
                      ? 'bg-op-accent text-op-accent-fg shadow-sm'
                      : 'text-op-muted hover:text-op-fg'
                  }`}
                >
                  {env === 'all' ? 'All Envs' : env}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-op-fg">
              <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Service & Tag</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Commit</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Deployed By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-op-border">
                {filteredHistory.map((dep) => (
                  <tr key={dep.id} className="hover:bg-op-raised/60 transition-colors">
                    <td className="px-4 py-3">
                      {dep.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-success/15 text-op-success border border-op-success/30">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-danger/15 text-op-danger border border-op-danger/30">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-op-fg">{dep.service}</span>
                        <span className="text-[11px] font-mono text-op-accent">{dep.version}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{dep.environment}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-subtle">{dep.commitHash}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{dep.duration}</td>
                    <td className="px-4 py-3 text-op-muted">{dep.deployedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert(`Initiating rollback for ${dep.service} (${dep.version})`)}
                        className="px-2.5 py-1 rounded bg-op-raised hover:bg-op-danger/20 text-op-muted hover:text-op-danger text-[11px] font-semibold flex items-center gap-1 border border-op-border ml-auto transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Trigger Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-op-surface border border-op-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-op-fg flex items-center gap-2">
              <Rocket className="w-5 h-5 text-op-accent" /> Trigger Platform Deployment
            </h3>
            <p className="text-xs text-op-muted">
              Select microservice and target Kubernetes / Docker environment to launch deployment pipeline.
            </p>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-op-muted font-semibold mb-1">Select Service</label>
                <select className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong">
                  <option value="payment-gateway">payment-gateway (main)</option>
                  <option value="auth-service">auth-service (main)</option>
                  <option value="analytics-worker">analytics-worker (main)</option>
                  <option value="billing-service">billing-service (main)</option>
                </select>
              </div>
              <div>
                <label className="block text-op-muted font-semibold mb-1">Target Environment</label>
                <select className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong">
                  <option value="production-us-east">Production (AWS us-east-1)</option>
                  <option value="staging-eu-west">Staging (K8s eu-west-1)</option>
                  <option value="dev-sandbox">Dev Sandbox</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-op-border">
              <Button variant="ghost" onClick={() => setIsDeployModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsDeployModalOpen(false)} className="text-xs">
                Launch Pipeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
