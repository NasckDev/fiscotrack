import { message as antdMessage } from 'antd';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { AppButton } from './AppButton';

type ToastTone = 'success' | 'info' | 'danger';

interface ToastOptions {
  readonly tone?: ToastTone;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly durationMs?: number;
}

export interface ToastApi {
  show(message: string, options?: ToastOptions): void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DEFAULT_DURATION_S = 6;
const TOAST_KEY = 'fiscotrack-toast';

/** Avisos curtos (`message` do Ant Design). Só um por vez: o novo substitui o anterior. */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [message, holder] = antdMessage.useMessage();
  const api = useMemo<ToastApi>(
    () => ({
      show(text, options = {}) {
        const { tone = 'success', action, durationMs } = options;
        const close = () => message.destroy(TOAST_KEY);
        message.open({
          key: TOAST_KEY,
          type: tone === 'danger' ? 'error' : tone,
          duration: (durationMs ?? DEFAULT_DURATION_S * 1000) / 1000,
          content: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span role={tone === 'danger' ? 'alert' : 'status'}>{text}</span>
              {action && (
                <AppButton
                  variant="link"
                  size="sm"
                  onClick={() => {
                    action.run();
                    close();
                  }}
                >
                  {action.label}
                </AppButton>
              )}
            </span>
          ),
        });
      },
    }),
    [message],
  );
  return (
    <ToastContext.Provider value={api}>
      {holder}
      {children}
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastApi {
  const context = useContext(ToastContext);
  if (context === null) throw new Error('useToasts precisa de <ToastProvider>.');
  return context;
}
