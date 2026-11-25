import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { NAV_ITEMS, TAB_ITEMS, TOP_ITEMS } from '../navigation';
import { useOperations } from '../state/OperationsContext';
import { EXAMPLE_ID_PREFIX } from '../state/useExampleLoader';
import { DB_ISSUE_EVENT } from '../storage/operationsRepository';
import {
  AppAvatar,
  AppButton,
  AppDropdown,
  AppIconButton,
  AppTabBar,
  setTheme,
  useAppColors,
  useBreakpoints,
  useTheme,
  useToasts,
  type AppMenuItem,
} from '../ui';
import { Disclaimer } from './Disclaimer';
import { ExampleBanner, FirstVisitLoader } from './ExampleBanner';
import { Logo } from './Logo';
import { MonthPicker } from './MonthPicker';
import { Notifications } from './Notifications';

const ShellOverlays = lazy(() => import('./ShellOverlays'));

const REPOSITORY_URL = 'https://github.com/NasckDev/fiscotrack';
const GO_SEQUENCE_MS = 1200;
const MAX_WIDTH = 1320;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

interface ShellActions {
  readonly openPalette: () => void;
  readonly openShortcuts: () => void;
}

function AccountMenu({ openShortcuts }: Pick<ShellActions, 'openShortcuts'>) {
  const navigate = useNavigate();
  const theme = useTheme();
  const items: readonly AppMenuItem[] = [
    {
      key: 'config',
      label: 'Configurações e backup',
      icon: 'settings',
      onSelect: () => void navigate('/config'),
    },
    {
      key: 'import',
      label: 'Importar CSV',
      icon: 'upload',
      onSelect: () => void navigate('/importar'),
    },
    {
      key: 'keys',
      label: 'Atalhos de teclado',
      icon: 'help',
      onSelect: openShortcuts,
      dividerBefore: true,
    },
    {
      key: 'github',
      label: 'Código no GitHub',
      icon: 'github',
      onSelect: () => window.open(REPOSITORY_URL, '_blank', 'noopener,noreferrer'),
    },
  ];
  return (
    <AppDropdown items={items}>
      <button
        type="button"
        aria-label={`Menu da conta (tema ${theme === 'dark' ? 'escuro' : 'claro'})`}
        aria-haspopup="menu"
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          minWidth: 44,
          minHeight: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppAvatar initials="VC" label="Você" />
      </button>
    </AppDropdown>
  );
}

/** Busca, avisos e tema: os mesmos no desktop e no celular. */
function HeaderTools({ openPalette }: Pick<ShellActions, 'openPalette'>) {
  const theme = useTheme();
  return (
    <>
      <AppIconButton
        icon="search"
        label="Buscar telas, ações e ativos (Ctrl K)"
        onClick={openPalette}
      />
      <Notifications />
      <AppIconButton
        icon={theme === 'dark' ? 'sun' : 'moon'}
        label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </>
  );
}

function HomeLink() {
  return (
    <Link
      to="/"
      aria-label="FiscoTrack, ir para o início"
      style={{
        display: 'inline-flex',
        minHeight: 44,
        alignItems: 'center',
        borderRadius: 12,
        textDecoration: 'none',
      }}
    >
      <Logo />
    </Link>
  );
}

/** Barra superior em pílula: logo, abas, seletor de mês e "Nova operação" (sem menu lateral). */
function TopBar({ openPalette, openShortcuts }: ShellActions) {
  const colors = useAppColors();
  return (
    <header
      className="ft-topbar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px 20px',
        background: colors.bgContainer,
        borderRadius: 32,
        padding: '8px 8px 8px 20px',
      }}
    >
      <HomeLink />
      <nav aria-label="Principal" style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {TOP_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="ft-nav-link">
            {item.shortLabel}
          </NavLink>
        ))}
      </nav>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HeaderTools openPalette={openPalette} />
          <AccountMenu openShortcuts={openShortcuts} />
        </div>
        <MonthPicker />
        <AppButton variant="primary" size="lg" icon="plus" to="/operacoes?nova=1">
          Nova operação
        </AppButton>
      </div>
    </header>
  );
}

/** Celular e tablet: logo e ferramentas na primeira linha; mês e "Nova operação" na segunda. */
function CompactBar({
  openPalette,
  openMenu,
}: Pick<ShellActions, 'openPalette'> & { readonly openMenu: () => void }) {
  const colors = useAppColors();
  return (
    <header
      className="ft-topbar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: colors.bgContainer,
        borderRadius: 28,
        padding: '8px 8px 10px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <HomeLink />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HeaderTools openPalette={openPalette} />
          <AppIconButton icon="menu" label="Abrir menu" aria-haspopup="dialog" onClick={openMenu} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingRight: 2 }}>
        <MonthPicker />
        <div style={{ flex: '1 1 auto' }}>
          <AppButton variant="primary" size="lg" icon="plus" to="/operacoes?nova=1" block>
            Nova operação
          </AppButton>
        </div>
      </div>
    </header>
  );
}

/** Rola ao topo quando a rota muda. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Atalhos globais: Ctrl/⌘ K, "?", "N" e "G" seguido da letra da tela. */
function useGlobalShortcuts({ openPalette, openShortcuts }: ShellActions) {
  const navigate = useNavigate();
  const goPending = useRef(false);

  useEffect(() => {
    let timer = 0;
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = event.key.toLowerCase();
      if (goPending.current) {
        goPending.current = false;
        const target = NAV_ITEMS.find((item) => item.goKey === key);
        if (target) void navigate(target.to);
        return;
      }
      if (key === 'g') {
        goPending.current = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (goPending.current = false), GO_SEQUENCE_MS);
      } else if (key === 'n') {
        void navigate('/operacoes?nova=1');
      } else if (event.key === '?') {
        openShortcuts();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.clearTimeout(timer);
    };
  }, [navigate, openPalette, openShortcuts]);
}

function ShellFooter() {
  const colors = useAppColors();
  const { operations } = useOperations();
  const hasExample = operations.some((operation) => operation.id.startsWith(EXAMPLE_ID_PREFIX));
  return (
    <footer style={{ fontSize: 13, color: colors.textMuted }}>
      <p style={{ margin: 0 }}>
        {hasExample ? 'Dados de exemplo. ' : ''}Esta ferramenta não substitui a orientação de um
        contador. Projeto open source educacional, licença MIT,{' '}
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: colors.text, fontWeight: 700, textDecoration: 'underline' }}
        >
          código no GitHub
        </a>
        .
      </p>
    </footer>
  );
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const screens = useBreakpoints();
  const isDesktop = Boolean(screens.lg);
  const isPhone = !screens.md;
  const colors = useAppColors();
  const toasts = useToasts();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasOpenedOverlay, setHasOpenedOverlay] = useState(false);
  if ((isPaletteOpen || isShortcutsOpen || isMenuOpen) && !hasOpenedOverlay) {
    setHasOpenedOverlay(true);
  }

  useEffect(() => {
    const handler = (event: Event) => {
      toasts.show(String((event as CustomEvent<string>).detail), { tone: 'danger' });
    };
    window.addEventListener(DB_ISSUE_EVENT, handler);
    return () => window.removeEventListener(DB_ISSUE_EVENT, handler);
  }, [toasts]);

  const openPalette = useCallback(() => setIsPaletteOpen(true), []);
  const openShortcuts = useCallback(() => {
    setIsPaletteOpen(false);
    setIsShortcutsOpen(true);
  }, []);
  useGlobalShortcuts({ openPalette, openShortcuts });

  return (
    <div style={{ minHeight: '100vh', background: colors.bgLayout, color: colors.text }}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: '0 auto',
          padding: isPhone
            ? '12px 14px calc(96px + env(safe-area-inset-bottom))'
            : '20px clamp(14px, 3vw, 40px) 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: isPhone ? 18 : 22,
        }}
      >
        {isDesktop ? (
          <TopBar openPalette={openPalette} openShortcuts={openShortcuts} />
        ) : (
          <CompactBar openPalette={openPalette} openMenu={() => setIsMenuOpen(true)} />
        )}
        <FirstVisitLoader />
        <main
          id="conteudo"
          tabIndex={-1}
          style={{
            outline: 'none',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Disclaimer />
          <ExampleBanner />
          <div>{children}</div>
        </main>
        <ShellFooter />
      </div>
      {isPhone && (
        <AppTabBar
          aria-label="Principal"
          items={TAB_ITEMS.map((item) => ({
            to: item.to,
            label: item.shortLabel,
            icon: item.icon,
          }))}
        />
      )}
      {hasOpenedOverlay && (
        <Suspense fallback={null}>
          <ShellOverlays
            isMenuOpen={isMenuOpen && !isDesktop}
            isPaletteOpen={isPaletteOpen}
            isShortcutsOpen={isShortcutsOpen}
            onCloseMenu={() => setIsMenuOpen(false)}
            onClosePalette={() => setIsPaletteOpen(false)}
            onCloseShortcuts={() => setIsShortcutsOpen(false)}
            onShowShortcuts={openShortcuts}
          />
        </Suspense>
      )}
    </div>
  );
}
