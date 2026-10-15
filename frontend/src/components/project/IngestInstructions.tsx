import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ingestUrl } from '../../lib/urls';

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard can be blocked; the text is still selectable
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
};

export const CodeBlock: React.FC<{ title: string; code: string }> = ({ title, code }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50">
    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</span>
      <CopyButton text={code} />
    </div>
    <pre className="overflow-x-auto p-3 text-xs leading-5 text-slate-700"><code>{code}</code></pre>
  </div>
);

/** How to ship logs to an APP_LOGS integration. `token` is only known right after creation. */
export const AppLogsInstructions: React.FC<{ projectId: number; token?: string; prefix?: string }> = ({ projectId, token, prefix }) => {
  const shown = token ?? (prefix ? `${prefix}…` : '<ingest token>');
  const url = ingestUrl(projectId);
  const curl = `curl -X POST '${url}' \\\n  -H 'Authorization: Bearer ${shown}' \\\n  -H 'Content-Type: application/json' \\\n  -d '[{"level":"ERROR","message":"payment failed","order_id":"A-1042"}]'`;
  const django = `# settings.py: ship Django logs to OpsPilot\nimport logging, requests\n\nclass OpsPilotHandler(logging.Handler):\n    def emit(self, record):\n        try:\n            requests.post(\n                "${url}",\n                headers={"Authorization": "Bearer ${shown}"},\n                json=[{"level": record.levelname, "message": self.format(record),\n                       "logger": record.name}],\n                timeout=2,\n            )\n        except Exception:\n            pass  # never let logging break the app\n\nLOGGING = {"version": 1, "handlers": {"opspilot": {"class": "myapp.logging.OpsPilotHandler"}},\n           "root": {"handlers": ["opspilot"], "level": "INFO"}}`;
  return (
    <div className="space-y-3">
      <CodeBlock title="curl" code={curl} />
      <CodeBlock title="Django (Python)" code={django} />
      <p className="text-xs text-slate-500">
        Accepts a JSON object, a JSON array, <code>{'{"logs": [...]}'}</code>, NDJSON, or plain text (one line per entry). Up to 1,000 entries per request.
        Fields: <code>message</code>, <code>level</code>, <code>timestamp</code>; any other simple field becomes searchable metadata.
      </p>
    </div>
  );
};

export { CopyButton };
