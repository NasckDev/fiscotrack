import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { NAV_ITEMS, TAB_ITEMS } from '../navigation';
import { DB_ISSUE_EVENT } from '../storage/operationsRepository';
import { ExampleBanner, FirstVisitLoader } from './ExampleBanner';
import { MobileMenu } from './MobileMenu';
import { useToasts } from './Toasts';
import { CommandPalette } from './CommandPalette';
import { Disclaimer } from './Disclaimer';
import { Icon } from './Icon';
import { Logo, LogoMark } from './Logo';
import { ShortcutsModal } from './ShortcutsModal';
import { ThemeToggle } from './ThemeToggle';

const REPOSITORY_URL = 'https://github.com/NasckDev/fiscotrack';
const GO_SEQUENCE_MS = 1200;

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
    isActive ? 'bg-accent-surface text-accent' : 'text-muted hover:bg-card-subtle hover:text-ink',
  ].join(' ');

const tabLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-colors',
    isActive ? 'text-accent' : 'text-muted',
  ].join(' ');

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

interface ShellActions {
  readonly openPalette: () => void;
  readonly openShortcuts: () => void;
}

function SearchButton({ openPalette }: Pick<ShellActions, 'openPalette'>) {
  return (
    <button
      type="button"
      onClick={openPalette}
      className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-line-soft bg-card px-3 text-sm text-muted transition-colors hover:border-line"
    >
      <Icon name="search" size={16} />
      <span className="flex-1 text-left">Buscar…</span>
      <kbd className="kbd">Ctrl K</kbd>
    </button>
  );
}

function Sidebar({ openPalette, openShortcuts }: ShellActions) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--ft-sidebar-width)] flex-col border-r border-line-soft bg-nav px-3 py-5 lg:flex">
      <div className="px-3 pb-5">
        <Logo />
      </div>
      <div className="pb-4">
        <SearchButton openPalette={openPalette} />
      </div>
      <nav aria-label="Principal" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={sidebarLinkClass}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-1">
        <div className="card-subtle p-3 text-xs text-muted">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            <Icon name="shield" size={14} />
            Dados só no navegador
          </p>
          <p className="mt-1">Nada é enviado a servidores; sem contas nem telemetria.</p>
        </div>
        <div className="flex items-center justify-between">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs text-muted hover:text-ink"
          >
            Código no GitHub
          </a>
          <span className="flex">
            <button
              type="button"
              className="icon-btn"
              aria-label="Atalhos de teclado"
              onClick={openShortcuts}
            >
              <Icon name="keyboard" />
            </button>
            <ThemeToggle />
          </span>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({
  openPalette,
  openMenu,
}: Pick<ShellActions, 'openPalette'> & { readonly openMenu: () => void }) {
  return (
    <header className="glass sticky top-0 z-30 flex h-[var(--ft-header-height)] items-center justify-between border-b border-line-soft px-4 lg:hidden">
      <span className="flex items-center gap-2.5">
        <LogoMark size={28} />
        <span className="text-base font-extrabold tracking-tight">
          Fisco<span className="text-accent">Track</span>
        </span>
      </span>
      <span className="flex">
        <button type="button" className="icon-btn" aria-label="Buscar" onClick={openPalette}>
          <Icon name="search" />
        </button>
        <ThemeToggle />
        <button
          type="button"
          className="icon-btn"
          aria-label="Menu: importar, regras e configurações"
          aria-haspopup="dialog"
          onClick={openMenu}
        >
          <Icon name="settings" />
        </button>
      </span>
    </header>
  );
}

function TabBar() {
  return (
    <nav
      aria-label="Principal"
      className="glass fixed inset-x-0 bottom-0 z-30 flex border-t border-line-soft pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {TAB_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={tabLinkClass}>
          <Icon name={item.icon} size={22} />
          {item.shortLabel}
        </NavLink>
      ))}
    </nav>
  );
}

/** Rola ao topo quando a rota muda, como em um app de verdade. */
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
      if (document.querySelector('dialog[open]')) return;
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

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion() ?? false;
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toasts = useToasts();
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
    <div className="min-h-screen">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      <Sidebar openPalette={openPalette} openShortcuts={openShortcuts} />
      <MobileHeader openPalette={openPalette} openMenu={() => setIsMenuOpen(true)} />
      <div className="flex min-h-[calc(100vh-var(--ft-header-height))] flex-col lg:min-h-screen lg:pl-[var(--ft-sidebar-width)]">
        <Disclaimer />
        <FirstVisitLoader />
        <ExampleBanner />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-[var(--ft-content-max)] flex-1 px-4 pt-5 outline-none sm:px-6 lg:px-10 lg:pt-8 lg:pb-12"
        >
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          >
            {children}
          </motion.div>
        </main>
        <footer className="px-4 pt-6 pb-[calc(var(--ft-tabbar-height)+env(safe-area-inset-bottom)+1rem)] text-center text-xs text-muted lg:hidden">
          Projeto open source educacional · MIT ·{' '}
          <a href={REPOSITORY_URL} className="link inline-flex min-h-11 items-center">
            GitHub
          </a>
        </footer>
      </div>
      <TabBar />
      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onShowShortcuts={openShortcuts}
      />
      <ShortcutsModal open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <MobileMenu open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
