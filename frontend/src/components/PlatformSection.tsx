import { useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronRight, GitBranch, GitCommitHorizontal, LockKeyhole, Server, Terminal } from 'lucide-react';
import { OpsPilotMark } from './OpsPilotLogo';
import '../styles/platform.css';

const CAPABILITIES = [
  { id: 'deployments', shortLabel: 'Deployments', label: 'Deploy with context.', description: 'Follow each release from commit to production. Know what shipped, where it runs, and who owns it.', icon: GitBranch, view: 'Deployment pipeline' },
  { id: 'infrastructure', shortLabel: 'Infrastructure', label: 'Know your runtime.', description: 'See cluster, node, and pod health together. Spot resource pressure and restarts in one clear view.', icon: Server, view: 'Infrastructure overview' },
  { id: 'logs', shortLabel: 'Logs & signals', label: 'Find the signal.', description: 'Follow container logs and filter the noise. Find the events that explain your service’s behavior.', icon: Terminal, view: 'Service logs' },
  { id: 'access', shortLabel: 'Access & roles', label: 'Keep access intentional.', description: 'Give everyone the right level of access. Keep changes and their owners visible in an audit trail.', icon: LockKeyhole, view: 'Access and activity' },
] as const;

type CapabilityId = typeof CAPABILITIES[number]['id'];

function PlatformPreview({ view }: { view: CapabilityId }) {
  if (view === 'deployments') return (
    <>
      <div className="platform-preview-heading"><span className="platform-demo-icon"><GitBranch size={20} /></span><div><h3>api-service</h3><p>Production deployment</p></div><span className="platform-demo-status"><Check size={12} /> Deployed</span></div>
      <div className="platform-commit"><GitCommitHorizontal size={15} /><span>Refine request handling</span><code>8f3a2c1</code></div>
      <div className="platform-pipeline" aria-label="Source, build, checks, and deployment complete">
        {['Source', 'Build', 'Checks', 'Deploy'].map((stage, index) => <div key={stage}><span className={index === 3 ? 'is-final' : ''}><Check size={14} /></span><p>{stage}</p></div>)}
      </div>
      <div className="platform-demo-details"><div><span>Repository</span><strong>acme / api-service</strong></div><div><span>Branch</span><strong><GitBranch size={12} /> main</strong></div><div><span>Environment</span><strong>Production</strong></div></div>
      <div className="platform-demo-note"><CheckCheck size={14} /><span>Every step. One connected history.</span></div>
    </>
  );
  if (view === 'infrastructure') return (
    <>
      <div className="platform-preview-heading"><span className="platform-demo-icon"><Server size={20} /></span><div><h3>Production cluster</h3><p>Nodes &amp; workloads</p></div><span className="platform-demo-status"><Check size={12} /> Healthy</span></div>
      <div className="platform-runtime-summary"><div><strong>02</strong><span>Nodes</span></div><div><strong>08</strong><span>Running pods</span></div><div><strong>00</strong><span>Restarts</span></div></div>
      <div className="platform-resource"><span>CPU usage</span><strong>24%</strong><div><i style={{ width: '24%' }} /></div></div>
      <div className="platform-resource"><span>Memory usage</span><strong>48%</strong><div><i style={{ width: '48%' }} /></div></div>
      <div className="platform-demo-details"><div><span>worker-01</span><strong><Check size={12} /> Ready</strong></div><div><span>worker-02</span><strong><Check size={12} /> Ready</strong></div></div>
      <div className="platform-demo-note"><Activity size={14} /><span>A clear view of the services behind your product.</span></div>
    </>
  );
  if (view === 'logs') return (
    <>
      <div className="platform-preview-heading"><span className="platform-demo-icon"><Terminal size={20} /></span><div><h3>api-service</h3><p>Container log stream</p></div><span className="platform-demo-status">Loki</span></div>
      <div className="platform-log-filter"><Terminal size={14} /><code>{'{ service="api-service" }'}</code><span>production</span></div>
      <div className="platform-log-lines">
        {[
          ['12:04:01', 'Service initialized'], ['12:04:02', 'Database connection ready'], ['12:04:03', 'Listening on port 8080'], ['12:04:06', 'GET /health  200  4ms'], ['12:04:08', 'GET /api/projects  200  12ms'], ['12:04:11', 'Job completed successfully'],
        ].map(([time, message]) => <div key={time}><time>{time}</time><span>INFO</span><code>{message}</code></div>)}
      </div>
      <div className="platform-demo-note"><Terminal size={14} /><span>The details you need, with their context intact.</span></div>
    </>
  );
  return (
    <>
      <div className="platform-preview-heading"><span className="platform-demo-icon"><LockKeyhole size={20} /></span><div><h3>Workspace access</h3><p>Roles &amp; permissions</p></div><span className="platform-demo-status">RBAC</span></div>
      <div className="platform-roles">
        {[
          ['Admin', 'Manage workspace and access'], ['Operator', 'Deploy and manage services'], ['Viewer', 'View projects and telemetry'],
        ].map(([role, description]) => <div key={role}><span className="platform-role-avatar">{role[0]}</span><div><strong>{role}</strong><p>{description}</p></div><Check size={14} /></div>)}
      </div>
      <div className="platform-audit"><span>AUDIT TRAIL</span><p><span className="platform-audit-dot" />Deployment approved <span>Operator · 2m ago</span></p></div>
      <div className="platform-demo-note"><LockKeyhole size={14} /><span>Clear permissions. Accountable changes.</span></div>
    </>
  );
}

export function PlatformSection() {
  const [selected, setSelected] = useState<CapabilityId>('deployments');
  const active = CAPABILITIES.find(item => item.id === selected)!;

  return (
    <section id="platform" className="platform-section" aria-labelledby="platform-title">
      <div className="platform-container">
        <div className="platform-section-heading">
          <div><p className="platform-eyebrow"><span>01</span> THE PLATFORM</p><h2 id="platform-title">Everything connected.<br /><span>Nothing in your way.</span></h2></div>
          <p className="platform-section-description">From the first commit to the last log line. A shared home for your releases, your runtime, and the people behind them.</p>
        </div>
        <div className="platform-explorer">
          <div className="platform-capabilities" role="group" aria-label="Explore platform capabilities">
            {CAPABILITIES.map(({ id, shortLabel, label, description, icon: Icon }, index) => (
              <button type="button" key={id} className="platform-capability" aria-pressed={selected === id} aria-controls="platform-preview" onClick={() => setSelected(id)}>
                <span className="platform-capability-top">
                  <span className="platform-capability-symbol" aria-hidden="true"><Icon size={20} strokeWidth={1.5} /></span>
                  <span className="platform-capability-number">0{index + 1}</span>
                </span>
                <span className="platform-capability-copy">
                  <span className="platform-capability-title">{label}</span>
                  <span className="platform-capability-short-title">{shortLabel}</span>
                  <span className="platform-capability-description">{description}</span>
                </span>
                <span className="platform-capability-footer" aria-hidden="true">
                  <span>{selected === id ? 'In view' : 'Explore'}</span>
                  <span className="platform-capability-icon"><ArrowUpRight size={16} /></span>
                </span>
              </button>
            ))}
          </div>
          <div className="platform-stage">
            <div className="platform-stage-label"><span>PLATFORM PREVIEW</span><span>0{CAPABILITIES.findIndex(item => item.id === selected) + 1} / 04</span></div>
            <p className="platform-mobile-description">{active.description}</p>
            <div id="platform-preview" className="platform-preview" role="region" aria-label={active.view} aria-live="polite" aria-atomic="true">
              <div className="platform-preview-bar"><OpsPilotMark size={23} /><span>Workspace</span><ChevronRight size={12} /><span>{active.view}</span></div>
              <div className="platform-preview-body" key={selected}><PlatformPreview view={selected} /></div>
            </div>
            <p className="platform-sample-caption">Product illustration <span aria-hidden="true">/</span> Sample workspace data</p>
          </div>
        </div>
        <div className="platform-section-footer"><p>Less switching. More building.</p><a href="#architecture">See how it connects <ArrowRight size={15} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
