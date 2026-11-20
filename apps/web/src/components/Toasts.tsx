import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';

type ToastTone = 'success' | 'info' | 'danger';

interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly action?: { readonly label: string; readonly run: () => void };
}

interface ToastOptions {
  readonly tone?: ToastTone;
  readonly action?: Toast['action'];
  readonly durationMs?: number;
}

interface ToastApi {
  show(message: string, options?: ToastOptions): void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DEFAULT_DURATION_MS = 6000;

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(1);
  const reduceMotion = useReducedMotion() ?? false;

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current.slice(-2),
        { id, message, tone: options.tone ?? 'success', action: options.action },
      ]);
      window.setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--ft-tabbar-height)+env(safe-area-inset-bottom)+0.75rem)] z-[1300] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-line-soft bg-card py-2 pr-2 pl-4 text-sm shadow-lg"
            >
              <Icon
                name={toast.tone === 'danger' ? 'circle-alert' : 'check-circle'}
                className={toast.tone === 'danger' ? 'text-danger' : 'text-success'}
              />
              <span className="min-w-0 flex-1 font-medium">{toast.message}</span>
              {toast.action !== undefined && (
                <button
                  type="button"
                  className="btn btn-ghost min-h-11 text-accent"
                  onClick={() => {
                    toast.action?.run();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                aria-label="Fechar aviso"
                onClick={() => dismiss(toast.id)}
              >
                <Icon name="x" size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastApi {
  const context = useContext(ToastContext);
  if (context === null) throw new Error('useToasts precisa de <ToastProvider>.');
  return context;
}
