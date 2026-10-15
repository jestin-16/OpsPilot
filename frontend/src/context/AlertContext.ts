import { createContext, useContext } from 'react';

export type AlertTone = 'success' | 'error' | 'warning' | 'info';

export interface AlertContextValue {
  showAlert: (message: string, tone?: AlertTone) => void;
}

export const AlertContext = createContext<AlertContextValue | null>(null);

export const useAlert = (): AlertContextValue => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};
