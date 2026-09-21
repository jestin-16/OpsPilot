// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  GitBranch,
  Layers,
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
  {
    icon: Radar,
    eyebrow: 'Observe',
    title: 'One operational picture',
    description: 'Bring deployments, logs, uptime checks, containers, and cluster health into one shared view.',
    tone: 'cyan',
  },
  {
    icon: Bot,
    eyebrow: 'Understand',
    title: 'AI-assisted diagnosis',
    description: 'Let OpsPilot correlate changes, signals, and ownership so the next action is immediately clear.',
    tone: 'violet',
  },
  {
    icon: Rocket,
    eyebrow: 'Deliver',
    title: 'Confident releases',
    description: 'Move from repository to runtime with visible deployment history and accountable control.',
    tone: 'amber',
  },
];

const workflow = [
  ['01', 'Connect the work', 'Register a repository, assign ownership, and bring your service signals into the unified workspace.'],
  ['02', 'Ship with context', 'Trigger deployments with the project, environment, version, and operator transparently attached.'],
  ['03', 'Resolve the right thing', 'Use AI summaries and live telemetry to focus the team on high-leverage remediations.'],
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchPrompt, setSearchPrompt] = useState('');

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPrompt.trim()) {
      go('/signup');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased">
      {/* Floating Modern Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-xl sm:px-10 lg:px-16">
        <button type="button" onClick={() => go('/')} className="group flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-200 group-hover:scale-105">
            <div className="absolute inset-0 translate-x-4 -skew-x-12 bg-red-500"></div>
            <span className="relative z-10 text-base font-bold leading-none text-white">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {['Platform', 'Workflow', 'Security', 'Pricing', 'Docs'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-gray-500 transition-colors duration-150 hover:text-black"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go('/login')}
            className="hidden px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-black sm:block"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => go('/signup')}
            className="rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 hover:shadow-md"
          >
            Get Started Free
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-gray-200 p-2 text-black md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-x-4 top-24 z-50 rounded-3xl border border-gray-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold text-gray-700">
            {['Platform', 'Workflow', 'Security', 'Pricing', 'Docs'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 transition hover:bg-gray-50 hover:text-black"
              >
                {item}
              </a>
            ))}
            <div className="mt-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => go('/signup')}
                className="w-full rounded-full bg-black py-3.5 text-center text-sm font-bold text-white shadow-md"
              >
                Get Started Free
              </button>
              <button
                type="button"
                onClick={() => go('/login')}
                className="mt-2 w-full rounded-full border border-gray-200 py-3 text-center text-sm font-bold text-black"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative isolate flex flex-col items-center justify-center overflow-hidden px-6 pt-36 pb-20 sm:pt-44 sm:pb-28 lg:px-12">
        {/* Subtle Ambient Radial Backlight */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-gray-200/40 via-gray-100/30 to-transparent blur-3xl animate-pulse-slow" />
        </div>

        {/* Floating Pill Badges with Smooth Asynchronous Float */}
        <div className="pointer-events-none absolute inset-0 -z-10 mx-auto hidden max-w-7xl lg:block">
          <div className="absolute top-[28%] left-[8%] flex flex-col items-center animate-float-slow">
            <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
              Workflows
            </div>
            <div className="mt-2 h-16 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
          </div>
          <div className="absolute top-[22%] right-[10%] flex flex-col items-center animate-float-reverse [animation-delay:1.5s]">
            <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
              Integrations
            </div>
            <div className="mt-2 h-20 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
          </div>
          <div className="absolute top-[68%] left-[12%] flex flex-col items-center animate-float-slow [animation-delay:3s]">
            <div className="mb-2 h-16 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
            <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
              Telemetry &amp; Logs
            </div>
          </div>
          <div className="absolute top-[62%] right-[12%] flex flex-col items-center animate-float-reverse [animation-delay:4.5s]">
            <div className="mb-2 h-20 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
            <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
              AI Copilot
            </div>
          </div>
        </div>

        <div className="z-10 flex max-w-5xl flex-col items-center text-center">
          {/* Eyebrow Pill */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-black/20 hover:shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            Introducing OpsPilot 2.0 · The Autonomous Ops Platform
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up [animation-delay:100ms] mt-6 text-5xl font-black tracking-tight text-black sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.04]">
            Automate Anything <br className="hidden sm:block" />
            You've Ever Managed. <br className="hidden sm:block" />
            In <span className="relative inline-block text-black">Seconds<span className="absolute -bottom-2 right-0 h-3.5 w-3.5 rounded-full bg-red-500 animate-pulse"></span></span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in-up [animation-delay:200ms] mt-7 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl font-normal">
            The intelligent operational workspace that brings all your deployments, infrastructure, and workflows into one unified, AI-driven command center.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up [animation-delay:300ms] mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go('/signup')}
              className="group flex h-14 items-center justify-center gap-3 rounded-full bg-black px-8 text-base font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] active:translate-y-0 cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <button
              type="button"
              onClick={() => go('/login')}
              className="flex h-14 items-center justify-center rounded-full border border-gray-200 bg-white px-8 text-base font-bold text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black hover:bg-gray-50 hover:shadow-md active:translate-y-0 cursor-pointer"
            >
              View Live Demo
            </button>
          </div>

          {/* Interactive Input Capsule */}
          <div className="animate-fade-in-up [animation-delay:400ms] mt-12 w-full max-w-lg">
            <form onSubmit={handlePromptSubmit} className="relative flex items-center rounded-full border border-gray-200/90 bg-white p-2 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100">
              <div className="pl-3.5 text-gray-400">
                <Terminal className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Ask OpsPilot anything (e.g. 'Deploy staging with v2.8')..."
                className="w-full bg-transparent px-3 py-2 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all duration-300 hover:bg-gray-800 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Submit prompt"
              >
                <div className="h-2 w-2 rotate-45 border-t-2 border-r-2 border-white"></div>
              </button>
            </form>

            {/* Suggested Quick Prompts */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Try:</span>
              {[
                'Deploy staging with v2.8',
                'Correlate error logs',
                'Inspect cluster health',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setSearchPrompt(prompt)}
                  className="rounded-full border border-gray-200/80 bg-white px-3 py-1 text-[11px] font-medium text-gray-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-black/30 hover:bg-gray-50 hover:text-black hover:shadow-xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Integration Trust Bar */}
        <div className="animate-fade-in-up [animation-delay:500ms] mt-24 w-full max-w-4xl px-6">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Engineered to integrate seamlessly with your stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-gray-600">
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <GitBranch className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> GitHub
            </div>
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <Cloud className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> AWS Cloud
            </div>
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <Box className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> Docker
            </div>
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <Cpu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> Kubernetes
            </div>
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <Activity className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> Prometheus
            </div>
            <div className="group flex items-center gap-2.5 text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-black cursor-pointer">
              <MessageSquare className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" /> Webhooks
            </div>
          </div>
        </div>
      </section>

      {/* METRICS COUNTER BAR */}
      <div className="border-b border-t border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {[
            ['01', 'Shared Workspace'],
            ['24/7', 'Signal Awareness'],
            ['100%', 'Owner Context'],
            ['< 1s', 'Pipeline Execution'],
          ].map(([value, label]) => (
            <div key={label} className="group px-6 py-8 text-center transition-all duration-300 hover:bg-gray-50/70">
              <p className="text-3xl font-black tracking-tight text-black sm:text-4xl transition-transform duration-300 group-hover:scale-105">{value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="bg-[#FAFAFA] text-black antialiased">
        {/* THE OPSPILOT OPERATING MODEL */}
        <section id="platform" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all duration-300 hover:border-black/20">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              The OpsPilot Operating Model
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl lg:text-6xl leading-[1.08]">
              A developer platform that <br className="hidden sm:inline" />
              <span className="text-gray-400">thinks in systems.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
              Keep the delivery workflow and the runtime reality seamlessly connected. Every signal has a project, every project has an owner, and every incident has an actionable starting point.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Card 1: Observe */}
            <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-400 ease-out hover:-translate-y-2 hover:border-gray-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.09)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-black shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
                    <Radar className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                    Observe
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-black">One operational picture</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                  Bring deployments, logs, uptime checks, containers, and cluster health into one shared view.
                </p>

                {/* Micro-preview Widget */}
                <div className="my-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 font-mono text-xs transition-colors group-hover:bg-gray-50">
                  <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400">
                    <span>LIVE SIGNALS</span>
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                      ALL HEALTHY
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 font-sans shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:translate-x-0.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-black">payment-service</span>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">18ms · 0 err</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 font-sans shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:translate-x-0.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-black">core-engine</span>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">100% up</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all duration-300 group-hover:gap-2.5">
                  See how it connects <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </article>

            {/* Card 2: Understand */}
            <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-400 ease-out hover:-translate-y-2 hover:border-gray-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.09)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-black shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
                    <Bot className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                    Understand
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-black">AI-assisted diagnosis</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                  Let OpsPilot correlate changes, signals, and ownership so the next action is immediately clear.
                </p>

                {/* Micro-preview Widget */}
                <div className="my-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 font-sans text-xs transition-colors group-hover:bg-gray-50">
                  <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold text-black">
                      <Sparkles className="h-3 w-3 text-red-500 transition-transform duration-300 group-hover:rotate-12" />
                      AI DIAGNOSTIC CORRELATION
                    </span>
                    <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white transition-transform duration-200 group-hover:scale-105">98% MATCH</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-3 text-[11px] leading-relaxed text-gray-600 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                    <span className="font-bold text-black">Root cause:</span> Memory pressure traced to commit <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-900">#b7e09c</code>. No user impact.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all duration-300 group-hover:gap-2.5">
                  See how it connects <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </article>

            {/* Card 3: Deliver */}
            <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-400 ease-out hover:-translate-y-2 hover:border-gray-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.09)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-black shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
                    <Rocket className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                    Deliver
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-black">Confident releases</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                  Move from repository to runtime with visible deployment history and accountable control.
                </p>

                {/* Micro-preview Widget */}
                <div className="my-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 font-sans text-xs transition-colors group-hover:bg-gray-50">
                  <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400">
                    <span>RELEASE PIPELINE</span>
                    <span className="text-[10px] font-bold text-black">PROD v2.8.4</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:-translate-y-0.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-400">Build</span>
                      <span className="text-xs font-bold text-black">0.5s ✓</span>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:-translate-y-0.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-400">Tests</span>
                      <span className="text-xs font-bold text-black">18/18 ✓</span>
                    </div>
                    <div className="rounded-xl bg-black p-2.5 text-center text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-transform duration-200 group-hover:-translate-y-0.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-400">Deploy</span>
                      <span className="text-xs font-bold text-white flex items-center justify-center gap-1">Live <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all duration-300 group-hover:gap-2.5">
                  See how it connects <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </article>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="border-t border-gray-100 bg-white py-24 text-black sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-2xs">
                A Shorter Path To Action
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl leading-[1.1]">
                From repository to <br className="hidden sm:inline" />
                reliable runtime.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-500">
                Make delivery visible to everyone who depends on it. OpsPilot turns handoffs into a collaborative workflow the whole team can inspect in real-time.
              </p>
              <button
                type="button"
                onClick={() => go('/signup')}
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                Create your workspace <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </div>
            <div className="grid gap-4">
              {workflow.map(([number, title, description]) => (
                <div
                  key={number}
                  className="group flex gap-5 rounded-2xl border border-gray-100 bg-[#FAFAFA] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:bg-white hover:shadow-lg cursor-pointer"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-black text-white shadow-2xs transition-all duration-300 group-hover:bg-red-500 group-hover:scale-105 group-hover:shadow-md">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-black transition-colors duration-200 group-hover:text-black">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTROL & SECURITY SECTION */}
        <section id="security" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-12 rounded-3xl border border-gray-200/80 bg-white p-8 sm:p-12 lg:grid-cols-[1.05fr_.95fr] lg:p-16 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)]">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-black shadow-2xs">
                <ShieldCheck className="h-6 w-6 text-black" />
              </span>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                Control without friction
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-black sm:text-4xl lg:text-5xl leading-[1.1]">
                Built for accountable operations.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
                Give engineers useful autonomy while keeping access, ownership, and deployment history visible. The platform scales the team’s judgment instead of hiding it.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm font-semibold text-black">
                {['Role-aware access', 'Audit-ready changes', 'Project ownership', 'Cloud-ready runtime'].map(item => (
                  <span key={item} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid content-center gap-3.5">
              <ControlCard icon={GitBranch} title="Delivery context" text="Commits, versions, environments, and operators stay attached to the release." />
              <ControlCard icon={Cloud} title="Infrastructure visibility" text="Monitor Docker, Kubernetes, cloud targets, and service health from one place." />
              <ControlCard icon={ShieldCheck} title="Protected by design" text="JWT sessions, role checks, and ownership rules support safer daily operations." />
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-6 pb-24 sm:px-8 lg:px-12 lg:pb-32">
          <div className="mx-auto max-w-7xl rounded-3xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 px-8 py-16 text-center text-black sm:px-16 sm:py-20 shadow-sm transition-all duration-500 hover:shadow-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-2xs">
              Make the next incident smaller
            </div>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-[1.15]">
              Give your team a better operational starting point.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
              Connect your first project and see what changes when delivery, infrastructure, and intelligence share the same workspace.
            </p>
            <button
              type="button"
              onClick={() => go('/signup')}
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-black px-8 py-4 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-1 active:translate-y-0 cursor-pointer"
            >
              Start with OpsPilot <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
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
                <li><a href="#security" className="text-gray-500 transition-colors duration-150 hover:text-black">Security &amp; RBAC</a></li>
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

const ControlCard: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({
  icon: Icon,
  title,
  text,
}) => (
  <div className="group flex gap-4 rounded-2xl border border-gray-100 bg-[#FAFAFA] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:bg-white hover:shadow-md cursor-pointer">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-black shadow-2xs transition-all duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-sm font-bold text-black transition-colors duration-200 group-hover:text-black">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
    </div>
  </div>
);
