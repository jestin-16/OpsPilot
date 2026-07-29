import React, { useState } from 'react';
import {
  FolderGit2,
  GitBranch,
  GitCommit,
  Plus,
  Search,
  Play,
  Filter,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

export const ProjectsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const projects = [
    {
      id: 'proj-1',
      name: 'payment-gateway',
      description: 'Stripe & PayPal transaction processing service with high throughput encryption.',
      repoUrl: 'github.com/opspilot/payment-gateway',
      tech: 'Go',
      branch: 'main',
      lastCommit: 'feat: add PCI-DSS audit logging (2 font ago)',
      author: 'Alex Mercer',
      status: 'healthy',
      buildStatus: 'passing',
      openPRs: 2,
    },
    {
      id: 'proj-2',
      name: 'auth-service',
      description: 'OAuth2, JWT authentication and RBAC user session manager built on Spring Boot.',
      repoUrl: 'github.com/opspilot/auth-service',
      tech: 'Java Spring Boot',
      branch: 'main',
      lastCommit: 'fix: refresh token rate-limiter threshold',
      author: 'Sarah Chen',
      status: 'healthy',
      buildStatus: 'passing',
      openPRs: 0,
    },
    {
      id: 'proj-3',
      name: 'analytics-worker',
      description: 'Real-time telemetry event collector and log aggregation pipeline.',
      repoUrl: 'github.com/opspilot/analytics-worker',
      tech: 'Python',
      branch: 'main',
      lastCommit: 'perf: optimize memory footprint on batch processing',
      author: 'Marcus Vance',
      status: 'warning',
      buildStatus: 'warning',
      openPRs: 4,
    },
    {
      id: 'proj-4',
      name: 'billing-service',
      description: 'Subscription billing engine and automated invoice generation.',
      repoUrl: 'github.com/opspilot/billing-service',
      tech: 'TypeScript',
      branch: 'main',
      lastCommit: 'initial commit: setup invoice PDF templates',
      author: 'Alex Mercer',
      status: 'healthy',
      buildStatus: 'passing',
      openPRs: 1,
    },
    {
      id: 'proj-5',
      name: 'notification-hub',
      description: 'WebSocket notification dispatch server and Slack webhook integrations.',
      repoUrl: 'github.com/opspilot/notification-hub',
      tech: 'TypeScript',
      branch: 'develop',
      lastCommit: 'refactor: socket reconnection backoff logic',
      author: 'Sarah Chen',
      status: 'healthy',
      buildStatus: 'passing',
      openPRs: 0,
    },
    {
      id: 'proj-6',
      name: 'opspilot-brain',
      description: 'Phase 2 AI operational intelligence engine for anomaly detection & root cause attribution.',
      repoUrl: 'github.com/opspilot/opspilot-brain',
      tech: 'Python',
      branch: 'main',
      lastCommit: 'feat: add vector database embeddings for log traces',
      author: 'AI Team',
      status: 'healthy',
      buildStatus: 'passing',
      openPRs: 3,
    },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTech = selectedTech === 'all' || p.tech === selectedTech;
    return matchesSearch && matchesTech;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <FolderGit2 className="w-6 h-6 text-op-accent" /> Microservice Repositories & Projects
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Manage source control links, branch health, CI/CD pipeline triggers, and repository settings.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="text-xs py-2.5 px-4 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Link New Repository
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-op-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects or repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong pl-9 pr-3 py-2 outline-none focus:border-op-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-op-subtle font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stack:
          </span>
          {['all', 'TypeScript', 'Go', 'Java Spring Boot', 'Python'].map((tech) => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTech === tech
                  ? 'bg-op-accent text-op-accent-fg shadow-sm'
                  : 'bg-op-surface text-op-muted hover:text-op-fg border border-op-border'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} hoverEffect className="flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-op-raised text-op-accent border border-op-border">
                  {project.tech}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${project.status === 'healthy' ? 'bg-op-success' : 'bg-op-warn'} animate-pulse`} />
                  <span className="text-[11px] font-semibold text-op-muted capitalize">{project.status}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-op-fg group-hover:text-op-accent transition-colors flex items-center gap-1.5">
                {project.name}
              </h3>
              <p className="text-xs text-op-muted mt-1.5 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-op-border flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-op-subtle font-mono">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-op-accent" />
                  {project.branch}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-op-muted">
                  <GitCommit className="w-3.5 h-3.5 text-op-subtle" />
                  {project.openPRs} PRs
                </span>
              </div>

              <div className="bg-op-bg/70 p-2 rounded border border-op-border/50 text-[11px] text-op-muted font-mono truncate">
                {project.lastCommit}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-op-subtle">
                  Author: <strong className="text-op-fg font-medium">{project.author}</strong>
                </span>
                <button
                  onClick={() => alert(`Triggering build for ${project.name}...`)}
                  className="px-2.5 py-1 rounded bg-op-raised hover:bg-op-accent/20 text-op-accent hover:text-op-accent-hover text-[11px] font-bold flex items-center gap-1 border border-op-border transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3" /> Build & Deploy
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-op-surface border border-op-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-op-fg flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-op-accent" /> Connect New Project Repository
            </h3>
            <p className="text-xs text-op-muted">
              Enter GitHub or GitLab repository details to link with OpsPilot deployment pipeline.
            </p>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-op-muted font-semibold mb-1">Repository URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/org/repo-name"
                  className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong"
                />
              </div>
              <div>
                <label className="block text-op-muted font-semibold mb-1">Target Microservice Name</label>
                <input
                  type="text"
                  placeholder="e.g. recommendation-engine"
                  className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-op-border">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setShowCreateModal(false)} className="text-xs">
                Connect Repository
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
