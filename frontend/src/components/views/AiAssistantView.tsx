import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  incidentData?: {
    rootCause: string;
    affectedService: string;
    recommendedAction: string;
    confidenceScore: string;
  };
}

export const AiAssistantView: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello Alex! I am OpsPilot Brain, your AI operational intelligence assistant. I analyze real-time cluster telemetry, Kubernetes pod events, and build pipeline logs to predict root causes and suggest automated runbooks.',
      timestamp: '18:40',
    },
    {
      id: 'm-2',
      sender: 'user',
      text: 'What caused the memory warning on analytics-worker-64b58498f?',
      timestamp: '18:41',
    },
    {
      id: 'm-3',
      sender: 'ai',
      text: 'I parsed the JVM heap dump and Prometheus metric traces for analytics-worker-64b58498f over the past 2 hours. Here is the automated Root Cause Attribution:',
      timestamp: '18:41',
      incidentData: {
        rootCause: 'Unbounded batch array allocation in log parsing loop during high event volume spike.',
        affectedService: 'analytics-worker:v1.8.0',
        recommendedAction: 'Increase pod memory limit from 1024Mi to 2048Mi AND apply patch PR #142 (stream batching).',
        confidenceScore: '96.4% High Confidence',
      },
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: inputQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptText = inputQuery;
    setInputQuery('');

    setTimeout(() => {
      const aiReply: Message = {
        id: `m-${Date.now() + 1}`,
        sender: 'ai',
        text: `OpsPilot AI evaluated your request: "${promptText}". Telemetry check completed across 14 connected microservices and 3 Kubernetes clusters. No critical security or deployment risks detected. All SLA targets are currently optimal.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  const presetPrompts = [
    'Analyze Incident #904 logs & stack trace',
    'Evaluate deployment safety for payment-gateway v2.4.1',
    'Recommend Kubernetes autoscaling limits',
    'Suggest Dockerfile multi-stage build optimization',
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Sparkles className="w-6 h-6 text-op-highlight" /> OpsPilot Brain — AI Operational Intelligence
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Phase 2 AI operational layer: automated root-cause incident analysis, risk scoring & predictive runbooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-op-highlight/15 text-op-highlight border border-op-highlight/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-op-highlight animate-pulse" /> Model Active (LLM + Vector DB)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chat Conversation Interface */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex flex-col h-[520px] p-0 overflow-hidden bg-op-surface border border-op-border">
            {/* Chat header */}
            <div className="bg-op-raised/90 p-4 border-b border-op-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-op-highlight/20 text-op-highlight border border-op-highlight/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-op-fg">OpsPilot Assistant</h3>
                  <span className="text-[11px] text-op-muted">Connected to Prometheus, K8s & Jenkins Logs</span>
                </div>
              </div>
              <button
                onClick={() => setMessages([messages[0]])}
                className="text-xs text-op-subtle hover:text-op-fg flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Message stream */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      msg.sender === 'user'
                        ? 'bg-op-accent text-op-accent-fg'
                        : 'bg-op-highlight/20 text-op-highlight border border-op-highlight/40'
                    }`}
                  >
                    {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-op-accent text-op-accent-fg font-medium rounded-tr-none'
                          : 'bg-op-raised text-op-fg border border-op-border rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.incidentData && (
                      <div className="bg-op-bg/90 border border-op-highlight/40 p-4 rounded-xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-op-border font-bold">
                          <span className="text-op-highlight flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Root Cause Attribution
                          </span>
                          <span className="text-op-success font-mono text-[11px]">{msg.incidentData.confidenceScore}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-op-subtle font-semibold">Affected Service:</span>
                          <code className="text-op-accent font-mono bg-op-input px-2 py-1 rounded">{msg.incidentData.affectedService}</code>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-op-subtle font-semibold">Root Cause:</span>
                          <p className="text-op-fg font-medium">{msg.incidentData.rootCause}</p>
                        </div>
                        <div className="flex flex-col gap-1 pt-2 border-t border-op-border">
                          <span className="text-op-subtle font-semibold">Recommended Fix Action:</span>
                          <p className="text-op-success font-bold">{msg.incidentData.recommendedAction}</p>
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-op-subtle font-mono self-start px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-op-raised border-t border-op-border flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask OpsPilot Brain about deployment safety, logs, or cluster health..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 bg-op-input text-op-fg text-xs rounded-xl border border-op-border-strong px-4 py-3 outline-none focus:border-op-highlight transition-colors"
              />
              <Button type="submit" variant="primary" className="bg-op-highlight hover:bg-op-highlight/80 text-white text-xs py-3 px-4 rounded-xl">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Sidebar: Preset Prompts & Predictive Risk Card */}
        <div className="flex flex-col gap-4">
          <Card className="bg-gradient-to-b from-op-surface to-op-raised border-op-highlight/30">
            <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-op-success" /> Deployment Safety Score
            </h3>
            <div className="bg-op-bg p-4 rounded-xl border border-op-border flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-op-muted">Overall Risk Level</span>
                <span className="text-lg font-black text-op-success font-mono">LOW (12 / 100)</span>
              </div>
              <div className="w-full bg-op-input h-2 rounded-full overflow-hidden">
                <div className="bg-op-success h-full w-[12%]" />
              </div>
              <p className="text-[11px] text-op-subtle leading-relaxed">
                OpsPilot AI analyzed recent commits and integration test coverage. Safe to deploy to production.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-op-accent" /> Recommended AI Queries
            </h3>
            <div className="flex flex-col gap-2">
              {presetPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputQuery(prompt)}
                  className="w-full p-2.5 rounded-lg bg-op-raised border border-op-border hover:border-op-highlight/50 text-left text-xs font-medium text-op-muted hover:text-op-fg transition-all cursor-pointer"
                >
                  &rarr; {prompt}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
