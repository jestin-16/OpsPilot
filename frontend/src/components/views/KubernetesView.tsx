import React, { useState } from 'react';
import {
  Server,
  Layers,
  FileCode,
  Terminal,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

export const KubernetesView: React.FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('production');
  const [searchPod, setSearchPod] = useState('');
  const [selectedYamlPod, setSelectedYamlPod] = useState<string | null>(null);

  const nodes = [
    { name: 'k8s-node-master-01', role: 'Control Plane', status: 'Ready', cpu: '18%', memory: '2.1 / 8 GB', k8sVersion: 'v1.30.2' },
    { name: 'k8s-node-worker-01', role: 'Worker Node', status: 'Ready', cpu: '42%', memory: '6.4 / 16 GB', k8sVersion: 'v1.30.2' },
    { name: 'k8s-node-worker-02', role: 'Worker Node', status: 'Ready', cpu: '36%', memory: '5.8 / 16 GB', k8sVersion: 'v1.30.2' },
  ];

  const pods = [
    {
      name: 'payment-gateway-7f89d4b9c-x29fa',
      namespace: 'production',
      node: 'k8s-node-worker-01',
      ip: '10.244.1.42',
      status: 'Running',
      restarts: 0,
      age: '4d 12h',
    },
    {
      name: 'auth-service-59c488f47-m019k',
      namespace: 'production',
      node: 'k8s-node-worker-02',
      ip: '10.244.2.18',
      status: 'Running',
      restarts: 1,
      age: '12d 3h',
    },
    {
      name: 'analytics-worker-64b58498f-p9012',
      namespace: 'production',
      node: 'k8s-node-worker-01',
      ip: '10.244.1.98',
      status: 'Warning',
      restarts: 4,
      age: '2d 6h',
    },
    {
      name: 'billing-service-918c50d4f-b8823',
      namespace: 'production',
      node: 'k8s-node-worker-02',
      ip: '10.244.2.77',
      status: 'Running',
      restarts: 0,
      age: '1d 18h',
    },
    {
      name: 'prometheus-k8s-0',
      namespace: 'kube-system',
      node: 'k8s-node-master-01',
      ip: '10.244.0.12',
      status: 'Running',
      restarts: 0,
      age: '30d',
    },
    {
      name: 'ingress-nginx-controller-765d799b7',
      namespace: 'kube-system',
      node: 'k8s-node-worker-01',
      ip: '10.244.1.04',
      status: 'Running',
      restarts: 0,
      age: '30d',
    },
    {
      name: 'staging-app-test-55b4129',
      namespace: 'staging',
      node: 'k8s-node-worker-02',
      ip: '10.244.2.99',
      status: 'Running',
      restarts: 2,
      age: '5h',
    },
  ];

  const filteredPods = pods.filter((p) => {
    const matchesNs = selectedNamespace === 'all' || p.namespace === selectedNamespace;
    const matchesQuery = p.name.toLowerCase().includes(searchPod.toLowerCase());
    return matchesNs && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Server className="w-6 h-6 text-op-accent" /> Kubernetes Cluster & Pod Topology
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Cluster node metrics, pod namespace inspector, YAML configuration generator & container shell debugging.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => alert('Syncing Kubernetes cluster topology...')}
          className="text-xs py-2 px-3 flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-op-accent" /> Sync Kubeconfig
        </Button>
      </div>

      {/* Cluster Node Status Cards */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-op-fg flex items-center gap-2">
          <Layers className="w-4 h-4 text-op-accent" /> Cluster Nodes ({nodes.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <Card key={node.name} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-op-raised text-op-accent border border-op-border">
                    {node.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-op-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-op-success animate-pulse" /> {node.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold font-mono text-op-fg">{node.name}</h3>
                <span className="text-[11px] text-op-subtle block font-mono mt-0.5">{node.k8sVersion}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-op-border grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-op-subtle block font-sans">CPU Usage</span>
                  <span className="font-bold text-op-fg">{node.cpu}</span>
                </div>
                <div>
                  <span className="text-[10px] text-op-subtle block font-sans">RAM Usage</span>
                  <span className="font-bold text-op-muted">{node.memory}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pod Matrix Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-op-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search pod name or IP..."
              value={searchPod}
              onChange={(e) => setSearchPod(e.target.value)}
              className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong pl-9 pr-3 py-2 outline-none focus:border-op-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-op-subtle font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Namespace:
            </span>
            {['all', 'production', 'kube-system', 'staging'].map((ns) => (
              <button
                key={ns}
                onClick={() => setSelectedNamespace(ns)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedNamespace === ns
                    ? 'bg-op-accent text-op-accent-fg shadow-sm'
                    : 'bg-op-surface text-op-muted hover:text-op-fg border border-op-border'
                }`}
              >
                {ns}
              </button>
            ))}
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-op-fg">
              <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pod Name</th>
                  <th className="px-4 py-3">Namespace</th>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">Pod IP</th>
                  <th className="px-4 py-3">Restarts</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3 text-right">Manifest & Exec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-op-border">
                {filteredPods.map((p) => (
                  <tr key={p.name} className="hover:bg-op-raised/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Running' ? 'bg-op-success/15 text-op-success border border-op-success/30' : 'bg-op-warn/15 text-op-warn border border-op-warn/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Running' ? 'bg-op-success animate-pulse' : 'bg-op-warn'}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-op-fg">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-accent">{p.namespace}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{p.node}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-subtle">{p.ip}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-fg">{p.restarts}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{p.age}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedYamlPod(p.name)}
                          title="View Manifest YAML"
                          className="p-1.5 rounded bg-op-raised hover:bg-op-accent/20 text-op-accent border border-op-border transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <FileCode className="w-3.5 h-3.5" /> YAML
                        </button>
                        <button
                          onClick={() => alert(`Opening kubectl exec shell for ${p.name}...`)}
                          title="Exec Shell"
                          className="p-1.5 rounded bg-op-raised hover:bg-op-highlight/20 text-op-highlight border border-op-border transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <Terminal className="w-3.5 h-3.5" /> Shell
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

      {/* YAML Modal */}
      {selectedYamlPod && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-op-surface border border-op-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-op-fg flex items-center gap-2">
                <FileCode className="w-4 h-4 text-op-accent" /> Kubernetes Pod Spec: {selectedYamlPod}
              </h3>
              <button
                onClick={() => setSelectedYamlPod(null)}
                className="text-xs text-op-muted hover:text-op-fg font-bold"
              >
                Close
              </button>
            </div>
            <pre className="bg-black/90 p-4 rounded-xl border border-op-border font-mono text-xs text-op-fg h-72 overflow-y-auto leading-relaxed">
{`apiVersion: v1
kind: Pod
metadata:
  name: ${selectedYamlPod}
  namespace: ${selectedNamespace}
  labels:
    app.kubernetes.io/name: microservice
    app.kubernetes.io/managed-by: OpsPilot-IDP
spec:
  containers:
  - name: app
    image: opspilot/app:v2.4.0
    ports:
    - containerPort: 8080
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "128Mi"
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
