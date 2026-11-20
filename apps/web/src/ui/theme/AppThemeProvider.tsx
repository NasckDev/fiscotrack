import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { buildTheme } from './buildTheme';
import { useTheme } from './mode';
import { PALETTES, type Palette } from './palette';

dayjs.locale('pt-br');

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => undefined;
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

function useQuery(query: string, fallback: boolean): boolean {
  return useSyncExternalStore(
    subscribeQuery(query),
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}

/** Celular: abaixo de 768 px (tabelas viram listas de cards). */
export function useIsMobile(): boolean {
  return !useQuery('(min-width: 768px)', true);
}

/** Preferência do sistema por menos movimento. */
export function useReducedMotion(): boolean {
  return useQuery('(prefers-reduced-motion: reduce)', false);
}

const PaletteContext = createContext<Palette>(PALETTES.light);

/** Cores de domínio (ganho, perda, DARF, gráficos) do tema ativo. */
export function useAppColors(): Palette {
  return useContext(PaletteContext);
}

/** Aplica fundo e cor de texto ao <body> (o Ant Design não estiliza o body). */
function BodySync() {
  const { token } = antdTheme.useToken();
  useEffect(() => {
    document.body.style.background = token.colorBgLayout;
    document.body.style.color = token.colorText;
  }, [token.colorBgLayout, token.colorText]);
  return null;
}

interface AppThemeProviderProps {
  readonly children: ReactNode;
  /** Força um tema (Storybook); por padrão segue o tema do <html>. */
  readonly mode?: 'light' | 'dark';
}

/**
 * Tema central: paleta do FiscoTrack aplicada como tokens do Ant Design, claro e escuro
 * (`darkAlgorithm`), com português do Brasil e contexto para `message` e `Modal`.
 */
export function AppThemeProvider({ children, mode }: AppThemeProviderProps) {
  const current = useTheme();
  const resolved = mode ?? current;
  const mobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const config = useMemo(
    () => buildTheme(resolved, { mobile, reducedMotion }),
    [resolved, mobile, reducedMotion],
  );

  return (
    <PaletteContext.Provider value={PALETTES[resolved]}>
      <ConfigProvider locale={ptBR} theme={config}>
        <AntdApp component={false}>
          <BodySync />
          {children}
        </AntdApp>
      </ConfigProvider>
    </PaletteContext.Provider>
  );
}
