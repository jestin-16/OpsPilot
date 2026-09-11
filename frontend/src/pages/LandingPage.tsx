import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Cloud,
  GitBranch,
  Menu,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';

const capabilities = [
  { icon: Radar, eyebrow: 'Observe', title: 'One operational picture', description: 'Bring deployments, logs, uptime checks, containers, and cluster health into one shared view.', tone: 'cyan' },
  { icon: Bot, eyebrow: 'Understand', title: 'AI-assisted diagnosis', description: 'Let OpsPilot correlate changes, signals, and ownership so the next action is clear.', tone: 'violet' },
  { icon: Rocket, eyebrow: 'Deliver', title: 'Confident releases', description: 'Move from repository to runtime with visible deployment history and accountable control.', tone: 'amber' },
];

const workflow = [
  ['01', 'Connect the work', 'Register a repository, assign ownership, and bring your service signals into the workspace.'],
  ['02', 'Ship with context', 'Trigger deployments with the project, environment, version, and operator attached.'],
  ['03', 'Resolve the right thing', 'Use AI summaries and live telemetry to focus the team on the highest-value action.'],
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (path: string) => { setMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-950">
      <section className="relative isolate overflow-hidden bg-white text-slate-900">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,.13),transparent_28%),radial-gradient(circle_at_12%_75%,rgba(129,140,248,.12),transparent_30%)]" />
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(15,23,42,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        
        <header className="sticky top-4 z-30 mx-4 flex max-w-7xl items-center justify-between border border-white/80 bg-white/85 px-4 py-3 shadow-[0_12px_35px_rgba(79,70,229,0.08)] backdrop-blur-xl sm:mx-8 sm:px-5 lg:mx-auto lg:px-6">
          <button type="button" onClick={() => go('/')} className="flex items-center gap-3 text-left" aria-label="OpsPilot home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600"><Terminal className="h-5 w-5" /></span>
            <span><span className="block text-lg font-black tracking-tight text-slate-950">OpsPilot</span><span className="block text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">AI-assisted IDP</span></span>
          </button>
          <nav className="hidden items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-1 text-sm font-semibold text-slate-600 md:flex">
            <a href="#platform" className="rounded-lg px-4 py-2 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm">Platform</a>
            <a href="#workflow" className="rounded-lg px-4 py-2 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm">Workflow</a>
            <a href="#control" className="rounded-lg px-4 py-2 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm">Control</a>
            <span className="ml-1 flex items-center gap-1.5 border-l border-slate-200 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button type="button" onClick={() => go('/login')} className="rounded-lg border border-transparent px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:text-indigo-600">Sign in</button>
            <button type="button" onClick={() => go('/signup')} className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700">Create workspace</button>
          </div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-slate-900 md:hidden" aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </header>
        {menuOpen && <div className="mx-5 mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xl md:hidden">
          <div className="grid gap-1 text-sm font-semibold text-slate-700">
            <a href="#platform" onClick={() => setMenuOpen(false)} className="rounded-lg border border-transparent px-3 py-2.5 hover:border-indigo-100 hover:text-indigo-600">Platform</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)} className="rounded-lg border border-transparent px-3 py-2.5 hover:border-indigo-100 hover:text-indigo-600">Workflow</a>
            <a href="#control" onClick={() => setMenuOpen(false)} className="rounded-lg border border-transparent px-3 py-2.5 hover:border-indigo-100 hover:text-indigo-600">Control</a>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
              <button type="button" onClick={() => go('/login')} className="rounded-lg border border-slate-300 py-2.5 font-bold text-slate-900">Sign in</button>
              <button type="button" onClick={() => go('/signup')} className="rounded-lg border border-indigo-600 bg-indigo-600 py-2.5 font-extrabold text-white hover:bg-indigo-700">Get started</button>
            </div>
          </div>
        </div>}
        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-20 sm:px-8 sm:pb-24 lg:min-h-[690px] lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
          <div className="landing-hero-copy max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-cyan-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />Operational intelligence for modern teams
            </div>
            <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-[5.25rem]">Run every service<br /><span className="text-indigo-600">with context.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">OpsPilot is the AI-assisted internal developer platform that connects your projects, deployments, infrastructure, and incidents in one calm command center.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => go('/signup')} className="group inline-flex items-center justify-center gap-2 border border-indigo-600 bg-indigo-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700">
                Start building <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button type="button" onClick={() => go('/login')} className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50">
                <Sparkles className="h-4 w-4 text-violet-500" /> Explore the platform
              </button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-500">
              {['Project-level ownership', 'Live infrastructure signals', 'AI-assisted next actions'].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />{item}</span>
              ))}
            </div>
          </div>
          <div className="landing-hero-preview"><OperationsPreview /></div>
        </div>
      </section>

      <div className="border-b border-t border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">{[['01', 'Shared workspace'], ['24/7', 'Signal awareness'], ['100%', 'Owner context'], ['1', 'Operational truth']].map(([value, label]) => <div key={label} className="px-4 py-6 text-center"><p className="text-xl font-black tracking-tight text-indigo-600 sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{label}</p></div>)}</div></div>

      <main className="bg-white text-slate-900">
        <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-indigo-500">The OpsPilot operating model</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-4xl">A developer platform that thinks in systems.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">Keep the delivery workflow and the runtime reality connected. Every signal has a project, every project has an owner, and every incident has a better starting point.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, eyebrow, title, description, tone }) => (
              <article key={title} className="group border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-slate-300 shadow-sm hover:shadow-md">
                <span className={`flex h-11 w-11 items-center justify-center border border-slate-200 bg-white ${tone === 'cyan' ? 'text-cyan-500' : tone === 'violet' ? 'text-violet-500' : 'text-amber-500'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className={`mt-7 text-[10px] font-extrabold uppercase tracking-[.18em] ${tone === 'cyan' ? 'text-cyan-500' : tone === 'violet' ? 'text-violet-500' : 'text-amber-500'}`}>{eyebrow}</p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-slate-900 transition group-hover:text-cyan-500">See how it connects <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-t border-b border-slate-200 bg-white py-20 text-slate-900 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-cyan-500">A shorter path to action</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">From repository to reliable runtime.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">Make delivery visible to everyone who depends on it. OpsPilot turns handoffs into a workflow the whole team can inspect.</p>
              <button type="button" onClick={() => go('/signup')} className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 transition hover:text-cyan-500">Create your workspace <ArrowRight className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4">
              {workflow.map(([number, title, description]) => (
                <div key={number} className="flex gap-5 border border-slate-200 bg-white p-5 transition hover:border-slate-300 shadow-sm hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 text-sm font-black text-slate-900">{number}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="control" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-10 border border-slate-200 bg-white p-7 sm:p-10 lg:grid-cols-[1.05fr_.95fr] lg:p-14 shadow-sm">
            <div>
              <span className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-white text-slate-900">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </span>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-indigo-500">Control without friction</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-4xl">Built for accountable operations.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Give engineers useful autonomy while keeping access, ownership, and deployment history visible. The platform scales the team’s judgment instead of hiding it.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm font-bold text-slate-900">
                {['Role-aware access', 'Audit-ready changes', 'Project ownership', 'Cloud-ready runtime'].map(item => (
                  <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {item}</span>
                ))}
              </div>
            </div>
            <div className="grid content-center gap-3">
              <ControlCard icon={GitBranch} title="Delivery context" text="Commits, versions, environments, and operators stay attached to the release." color="text-cyan-500" />
              <ControlCard icon={Cloud} title="Infrastructure visibility" text="Monitor Docker, Kubernetes, cloud targets, and service health from one place." color="text-amber-500" />
              <ControlCard icon={ShieldCheck} title="Protected by design" text="JWT sessions, role checks, and ownership rules support safer daily operations." color="text-emerald-500" />
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <div className="mx-auto max-w-7xl border border-slate-200 bg-white px-7 py-12 text-center text-slate-900 sm:px-12 sm:py-16 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-cyan-500">Make the next incident smaller</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-.04em] sm:text-4xl">Give your team a better operational starting point.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Connect your first project and see what changes when delivery, infrastructure, and intelligence share the same workspace.</p>
            <button type="button" onClick={() => go('/signup')} className="mt-8 inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-5 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
              Start with OpsPilot <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white text-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center border border-slate-200 bg-white text-slate-900"><Terminal className="h-3.5 w-3.5" /></span>
            <span>© 2026 OpsPilot. Built for dependable delivery.</span>
          </div>
          <div className="flex gap-5 text-xs font-bold text-slate-500">
            <button type="button" onClick={() => go('/login')} className="hover:text-cyan-500">Sign in</button>
            <button type="button" onClick={() => go('/signup')} className="hover:text-cyan-500">Create account</button>
            <a href="#platform" className="hover:text-cyan-500">Platform</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ControlCard: React.FC<{ icon: React.ElementType; title: string; text: string; color: string }> = ({ icon: Icon, title, text, color }) => (
  <div className="flex gap-3 border border-slate-200 bg-white p-4 transition hover:border-slate-300 shadow-sm">
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white ${color}`}><Icon className="h-4 w-4" /></span>
    <div>
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  </div>
);

const OperationsPreview: React.FC = () => (
  <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
    <div className="relative border border-slate-200 bg-white p-2 shadow-[0_30px_80px_rgba(79,70,229,0.16)] sm:p-3">
      <div className="overflow-hidden border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"><Activity className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold text-white">OpsPilot / Command view</p><p className="mt-1 text-[11px] text-slate-400">A live read on delivery and runtime</p></div>
          </div>
          <span className="hidden items-center gap-1.5 border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Healthy</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
          <div className="border border-white/10 bg-white/[.06] p-4">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-white">Release pulse</p><p className="mt-1 text-[10px] text-slate-400">Production · last 24 hours</p></div><span className="text-xs font-black text-cyan-300">+18.4%</span></div>
            <div className="mt-5 flex h-28 items-end gap-2 border-b border-l border-white/10 px-2 pb-0">
              {[34, 48, 42, 68, 55, 74, 64, 92, 78, 100, 86, 108].map((height, index) => <span key={index} className={`group relative flex-1 ${index > 8 ? 'bg-cyan-300' : 'bg-indigo-400/70'} transition hover:bg-cyan-200`} style={{ height: `${height}%` }}><span className="absolute -top-4 left-1/2 hidden -translate-x-1/2 text-[9px] font-bold text-cyan-200 group-hover:block">{index + 1}</span></span>)}
            </div>
            <div className="mt-3 flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500"><span>00:00</span><span>12:00</span><span>Now</span></div>
          </div>
          <div className="border border-white/10 bg-white/[.06] p-4">
            <p className="text-xs font-bold text-white">Runtime health</p>
            <div className="mt-4 grid gap-3">
              {[['Services', '12 / 12', 'bg-emerald-300', 'text-emerald-300'], ['Deployments', '08 today', 'bg-cyan-300', 'text-cyan-300'], ['Open signals', '03 review', 'bg-amber-300', 'text-amber-300']].map(([label, value, dot, color]) => <div key={label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-[10px] font-semibold text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</span><span className={`text-[11px] font-black ${color}`}>{value}</span></div>)}
            </div>
            <div className="mt-5 border border-violet-300/20 bg-violet-300/10 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-violet-200"><Sparkles className="h-3.5 w-3.5" /> AI brief</div><p className="mt-2 text-[10px] leading-4 text-slate-300">No critical drift detected across production.</p></div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[.06] px-4 py-3"><div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latest deployment</span><span className="h-1 w-1 rounded-full bg-slate-500" /><span className="text-xs font-bold text-white">payment-service v2.8.4</span></div><span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300"><Check className="h-3.5 w-3.5" /> Deployed 4m ago</span></div>
      </div>
    </div>
  </div>
);
