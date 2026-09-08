import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type AlertTone = 'success' | 'error' | 'warning' | 'info';

interface AlertItem {
  id: number;
  message: string;
  tone: AlertTone;
}

interface AlertContextValue {
  showAlert: (message: string, tone?: AlertTone) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const inferTone = (message: string): AlertTone => {
  if (/success|synced|complete|saved|created/i.test(message)) return 'success';
  if (/warn|caution/i.test(message)) return 'warning';
  if (/fail|error|unable|invalid|unreachable/i.test(message)) return 'error';
  return 'info';
};

const toneStyles: Record<AlertTone, { wrapper: string; icon: string; Icon: typeof Info; label: string }> = {
  success: { wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-950', icon: 'bg-emerald-100 text-emerald-600', Icon: CheckCircle2, label: 'Success' },
  error: { wrapper: 'border-rose-200 bg-rose-50 text-rose-950', icon: 'bg-rose-100 text-rose-600', Icon: AlertCircle, label: 'Action needed' },
  warning: { wrapper: 'border-amber-200 bg-amber-50 text-amber-950', icon: 'bg-amber-100 text-amber-600', Icon: TriangleAlert, label: 'Heads up' },
  info: { wrapper: 'border-indigo-200 bg-indigo-50 text-indigo-950', icon: 'bg-indigo-100 text-indigo-600', Icon: Info, label: 'Update' },
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((message: string, tone = inferTone(message)) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setAlerts((current) => [...current, { id, message, tone }].slice(-4));
    window.setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => showAlert(String(message ?? ''));
    return () => { window.alert = nativeAlert; };
  }, [showAlert]);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] mx-auto flex w-auto max-w-md flex-col gap-3 sm:left-auto sm:right-5 sm:mx-0 sm:w-full" aria-live="polite" aria-atomic="true">
        {alerts.map((alert) => {
          const { wrapper, icon, Icon, label } = toneStyles[alert.tone];
          return (
            <div key={alert.id} role="status" className={`pointer-events-auto alert-toast flex items-start gap-3 rounded-2xl border p-3.5 shadow-xl shadow-slate-900/10 ${wrapper}`}>
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${icon}`}>
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-65">{label}</p>
                <p className="mt-0.5 break-words text-sm font-medium leading-5">{alert.message}</p>
              </div>
              <button type="button" onClick={() => dismiss(alert.id)} aria-label="Dismiss alert" className="-mr-1 -mt-1 rounded-lg p-1.5 opacity-60 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextValue => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};
