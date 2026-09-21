// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Box,
  Check,
  ChevronRight,
  Cloud,
  GitBranch,
  Menu,
  MessageSquare,
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
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-slate-900 selection:bg-gray-200 selection:text-black">
      <header className="absolute inset-x-0 top-0 z-50 flex h-24 items-center justify-between px-6 lg:px-12">
        <button type="button" onClick={() => go('/')} className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-red-500 transform -skew-x-12 translate-x-4"></div>
            <span className="relative text-white font-bold text-lg leading-none z-10">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
        </button>
        <nav className="hidden items-center gap-10 md:flex">
          {['Features', 'Integrations', 'Pricing', 'Blog', 'Company'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold text-gray-500 transition hover:text-black">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => go('/login')} className="hidden rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 md:block">Log in</button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-slate-900 md:hidden" aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      {menuOpen && <div className="absolute inset-x-4 top-24 z-50 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl md:hidden">
        <div className="grid gap-2 text-sm font-semibold text-gray-600">
          {['Features', 'Integrations', 'Pricing', 'Blog', 'Company'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-gray-50 hover:text-black">{item}</a>
          ))}
          <div className="mt-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => go('/login')} className="w-full rounded-full bg-black py-3 text-center text-white font-semibold">Log in</button>
          </div>
        </div>
      </div>}

      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 lg:px-8">
        {/* Abstract 3D Ribbon/Wave Graphic (CSS/SVG) background */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
           <svg className="absolute w-full h-[800px] opacity-[0.65] mix-blend-multiply" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
             <path d="M-100,450 C150,450 250,150 500,200 C750,250 850,450 1100,350" stroke="url(#ribbon-grad-1)" strokeWidth="80" strokeLinecap="round" filter="url(#drop-shadow)" />
             <path d="M-50,550 C200,550 300,250 550,300 C800,350 900,550 1150,450" stroke="url(#ribbon-grad-2)" strokeWidth="60" strokeLinecap="round" filter="url(#drop-shadow)" opacity="0.8" />
             <path d="M100,100 C300,50 400,350 650,400 C900,450 950,250 1200,300" stroke="url(#ribbon-grad-3)" strokeWidth="40" strokeLinecap="round" filter="url(#drop-shadow)" opacity="0.6" />
             
             <defs>
               <linearGradient id="ribbon-grad-1" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                 <stop offset="0%" stopColor="#f8fafc" />
                 <stop offset="30%" stopColor="#e2e8f0" />
                 <stop offset="70%" stopColor="#cbd5e1" />
                 <stop offset="100%" stopColor="#f1f5f9" />
               </linearGradient>
               <linearGradient id="ribbon-grad-2" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                 <stop offset="0%" stopColor="#ffffff" />
                 <stop offset="50%" stopColor="#f1f5f9" />
                 <stop offset="100%" stopColor="#e2e8f0" />
               </linearGradient>
               <linearGradient id="ribbon-grad-3" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                 <stop offset="0%" stopColor="#e2e8f0" />
                 <stop offset="50%" stopColor="#f8fafc" />
                 <stop offset="100%" stopColor="#cbd5e1" />
               </linearGradient>
               <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                 <feDropShadow dx="0" dy="20" stdDeviation="25" floodOpacity="0.08" />
                 <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.04" />
               </filter>
             </defs>
           </svg>
        </div>
        
        {/* Floating pills with lines */}
        <div className="absolute inset-0 -z-10 mx-auto max-w-7xl hidden lg:block pointer-events-none">
          <div className="absolute top-[25%] left-[10%] flex flex-col items-center opacity-90 animate-[pulse_4s_ease-in-out_infinite]">
             <div className="rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wide text-gray-500 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">Workflows</div>
             <div className="h-24 w-px bg-gradient-to-b from-gray-300 to-transparent mt-2"></div>
          </div>
          <div className="absolute top-[20%] right-[15%] flex flex-col items-center opacity-90 animate-[pulse_5s_ease-in-out_infinite_1s]">
             <div className="rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wide text-gray-500 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">Integrations</div>
             <div className="h-32 w-px bg-gradient-to-b from-gray-300 to-transparent mt-2"></div>
          </div>
          <div className="absolute top-[65%] left-[15%] flex flex-col items-center opacity-90 animate-[pulse_4.5s_ease-in-out_infinite_0.5s]">
             <div className="h-24 w-px bg-gradient-to-t from-gray-300 to-transparent mb-2"></div>
             <div className="rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wide text-gray-500 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">Reports & Docs</div>
          </div>
          <div className="absolute top-[60%] right-[12%] flex flex-col items-center opacity-90 animate-[pulse_5.5s_ease-in-out_infinite_1.5s]">
             <div className="h-28 w-px bg-gradient-to-t from-gray-300 to-transparent mb-2"></div>
             <div className="rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wide text-gray-500 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">Ask anything</div>
          </div>
        </div>

        <div className="z-10 flex max-w-5xl flex-col items-center text-center mt-12">
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center rounded-full border border-gray-200 bg-white/60 px-4 py-1.5 text-sm font-semibold text-gray-600 backdrop-blur-md shadow-sm">
            <span className="mr-2.5 h-2 w-2 rounded-full bg-red-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
            Introducing the next generation of operations
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl font-black tracking-tight text-[#111] sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05]">
            Automate Anything <br className="hidden sm:block" />
            You've Ever Managed. <br className="hidden sm:block" />
            In <span className="relative inline-block text-black">Seconds<span className="absolute -bottom-2.5 right-0 h-3.5 w-3.5 rounded-full bg-red-500"></span></span>
          </h1>
          
          {/* Subheading */}
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl font-medium">
            The intelligent operational workspace that brings all your deployments, infrastructure, and workflows into one unified, AI-driven command center.
          </p>
          
          {/* CTA */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button type="button" onClick={() => go('/signup')} className="group flex h-14 items-center justify-center gap-3 rounded-full bg-black px-8 text-base font-bold text-white transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-300/50 hover:-translate-y-0.5">
              Get Started Free
              <ArrowRight className="h-4 w-4 text-red-500 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          
          {/* Input bar */}
          <div className="mt-14 w-full max-w-[28rem]">
            <div className="relative flex items-center rounded-full border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-100">
              <div className="pl-4 text-gray-400">
                <Terminal className="h-5 w-5" />
              </div>
              <input 
                type="text" 
                placeholder="Ask OpsPilot anything..." 
                className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA] transition hover:bg-gray-100 border border-gray-100">
                <div className="h-2.5 w-2.5 rotate-45 bg-red-500"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="absolute bottom-10 left-0 right-0 z-10 w-full px-6 hidden sm:block">
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Works seamlessly with your favorite tools</p>
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-14 gap-y-8 opacity-40 grayscale transition-opacity hover:opacity-60">
            <div className="flex items-center gap-2.5 font-bold text-gray-700 tracking-tight"><GitBranch className="h-6 w-6"/> GitHub</div>
            <div className="flex items-center gap-2.5 font-bold text-gray-700 tracking-tight"><Cloud className="h-6 w-6"/> AWS</div>
            <div className="flex items-center gap-2.5 font-bold text-gray-700 tracking-tight"><Box className="h-6 w-6" /> Docker</div>
            <div className="flex items-center gap-2.5 font-bold text-gray-700 tracking-tight"><Activity className="h-6 w-6"/> Datadog</div>
            <div className="flex items-center gap-2.5 font-bold text-gray-700 tracking-tight"><MessageSquare className="h-6 w-6" /> Slack</div>
          </div>
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

      {/* Aesthetic Global-Trending Minimal White Footer */}
      <footer className="border-t border-gray-100 bg-white text-black antialiased">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-12 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-5 flex flex-col justify-between">
              <div>
                <button type="button" onClick={() => go('/')} className="flex items-center gap-3 group text-left">
                  <div className="relative flex h-8 w-8 items-center justify-center bg-black rounded-lg overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                    <div className="absolute inset-0 bg-red-500 transform -skew-x-12 translate-x-4"></div>
                    <span className="relative text-white font-bold text-base leading-none z-10">O</span>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
                </button>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
                  The intelligent operational workspace. Unifying deployments, infrastructure, and observability into one command center.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 px-3.5 py-1.5 text-xs font-medium text-gray-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>Systems operational</span>
                </div>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#platform" className="text-gray-500 transition-colors duration-150 hover:text-black">Features</a></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">Deployments</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">Docker &amp; K8s</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">Observability</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">CI/CD Engine</button></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Platform</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#workflow" className="text-gray-500 transition-colors duration-150 hover:text-black">Workflows</a></li>
                <li><a href="#control" className="text-gray-500 transition-colors duration-150 hover:text-black">Security &amp; RBAC</a></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">Audit Logging</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black">API Reference</button></li>
                <li><a href="https://github.com/opspilot" target="_blank" rel="noreferrer" className="text-gray-500 transition-colors duration-150 hover:text-black">Documentation</a></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3 lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Connect</h3>
              <p className="mt-4 text-sm text-gray-500">
                Ready to transform your delivery workflows?
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="rounded-full bg-black px-5 py-2 text-xs font-bold text-white transition hover:bg-gray-800 hover:shadow-md"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-black transition hover:border-black"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span>&copy; 2026 OpsPilot, Inc. Built for dependable delivery.</span>
            </div>
            <div className="flex items-center gap-6 font-medium text-gray-500">
              <a href="#privacy" className="transition-colors hover:text-black">Privacy Policy</a>
              <a href="#terms" className="transition-colors hover:text-black">Terms of Service</a>
              <a href="#security" className="transition-colors hover:text-black">Security</a>
              <a href="https://github.com/opspilot" target="_blank" rel="noreferrer" className="transition-colors hover:text-black">GitHub</a>
            </div>
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
