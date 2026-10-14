import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

type Tone = 'info' | 'ok' | 'warn' | 'next';

interface Scenario {
  prompt: string;
  lines: { tone: Tone; text: string }[];
}

// Scripted sample sessions for the home page preview; nothing here talks to a backend.
const SCENARIOS: Scenario[] = [
  {
    prompt: 'Deploy staging with v2.8',
    lines: [
      { tone: 'info', text: 'Resolving payments-api · env staging' },
      { tone: 'ok', text: 'Build passed · 18/18 tests green' },
      { tone: 'ok', text: 'Rolled out v2.8 to 3/3 pods in 41s' },
      { tone: 'next', text: 'Healthy · p95 182ms · 0 errors' },
    ],
  },
  {
    prompt: 'Correlate error logs',
    lines: [
      { tone: 'info', text: 'Scanning 12,408 log lines from the last 15m' },
      { tone: 'warn', text: '214 × TimeoutError in checkout-service' },
      { tone: 'ok', text: 'Started 4m after deploy #b7e09c' },
      { tone: 'next', text: 'Suggested: roll back checkout-service to v2.7.9' },
    ],
  },
  {
    prompt: 'Inspect cluster health',
    lines: [
      { tone: 'info', text: 'Querying cluster prod-eu-1 · 3 nodes' },
      { tone: 'ok', text: '42/42 pods running · 0 restarts' },
      { tone: 'warn', text: 'node-2 memory at 87%' },
      { tone: 'next', text: 'Suggested: scale workers 3 → 4' },
    ],
  },
];

const TONE: Record<Tone, { glyph: string; className: string }> = {
  info: { glyph: '→', className: 'text-gray-400' },
  ok: { glyph: '✓', className: 'text-emerald-600' },
  warn: { glyph: '!', className: 'text-amber-500' },
  next: { glyph: '●', className: 'text-red-500' },
};

const TYPE_MS = 38;
const LINE_MS = 520;
const HOLD_MS = 3400;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface HeroConsoleProps {
  /** Called with the visitor's own prompt when they submit the input. */
  onSubmit: (prompt: string) => void;
}

/** A self-playing copilot preview: types a sample prompt, then streams its result lines. */
export const HeroConsole: React.FC<HeroConsoleProps> = ({ onSubmit }) => {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);
  const [draft, setDraft] = useState('');
  // Stops cycling through the samples once the visitor picks one themselves.
  const autoplay = useRef(true);

  const scenario = SCENARIOS[active];

  useEffect(() => {
    const { prompt, lines } = SCENARIOS[active];
    if (prefersReducedMotion()) {
      setTyped(prompt.length);
      setShown(lines.length);
      return;
    }
    setTyped(0);
    setShown(0);
    const timers: number[] = [];
    let at = 350;
    for (let c = 1; c <= prompt.length; c++) {
      at += TYPE_MS;
      timers.push(window.setTimeout(() => setTyped(c), at));
    }
    at += 380;
    for (let i = 1; i <= lines.length; i++) {
      timers.push(window.setTimeout(() => setShown(i), at));
      at += LINE_MS;
    }
    timers.push(
      window.setTimeout(() => {
        if (autoplay.current) setActive((a) => (a + 1) % SCENARIOS.length);
      }, at + HOLD_MS),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, run]);

  const play = (index: number) => {
    autoplay.current = false;
    setActive(index);
    setRun((r) => r + 1);
  };

  const typing = typed < scenario.prompt.length;
  const thinking = !typing && shown < scenario.lines.length;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200/90 bg-white text-left shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] transition-shadow duration-500 hover:shadow-[0_32px_70px_-20px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#FAFAFA] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </div>
          <span className="font-mono text-[11px] font-semibold text-gray-500">
            opspilot copilot<span className="hidden sm:inline"> · prod-eu-1</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Sample<span className="hidden sm:inline"> session</span>
        </span>
      </div>

      <div className="h-[212px] space-y-2 px-5 py-4 font-mono text-[12.5px] leading-relaxed sm:h-[188px]" aria-live="polite">
        <p className="font-semibold text-black">
          <span className="mr-2 text-red-500">$</span>
          {scenario.prompt.slice(0, typed)}
          {(typing || shown === scenario.lines.length) && <span className="landing-caret" aria-hidden />}
        </p>
        {scenario.lines.slice(0, shown).map((line, i) => (
          <p key={`${active}-${run}-${i}`} className="landing-console-line flex gap-2.5">
            <span className={`w-3 shrink-0 text-center font-bold ${TONE[line.tone].className}`}>{TONE[line.tone].glyph}</span>
            <span className={line.tone === 'next' ? 'font-semibold text-black' : 'text-gray-600'}>{line.text}</span>
          </p>
        ))}
        {thinking && (
          <p className="flex items-center gap-2.5 text-gray-400">
            <span className="flex w-3 justify-center gap-0.5" aria-hidden>
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
            </span>
            thinking…
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 bg-[#FAFAFA] p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) onSubmit(draft.trim());
          }}
          className="flex items-center rounded-full border border-gray-200/90 bg-white p-1.5 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100"
        >
          <Terminal className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => (autoplay.current = false)}
            placeholder="Ask OpsPilot anything…"
            aria-label="Ask OpsPilot anything"
            className="w-full min-w-0 bg-transparent px-3 py-2 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Submit prompt"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all duration-300 hover:scale-105 hover:bg-gray-800 active:scale-95 cursor-pointer"
          >
            <span className="h-2 w-2 -translate-x-px rotate-45 border-t-2 border-r-2 border-white" />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Try:</span>
          {SCENARIOS.map((s, i) => (
            <button
              key={s.prompt}
              type="button"
              onClick={() => play(i)}
              aria-pressed={i === active}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                i === active
                  ? 'border-black bg-black text-white shadow-md'
                  : 'border-gray-200/80 bg-white text-gray-600 hover:border-black/30 hover:text-black'
              }`}
            >
              {s.prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
