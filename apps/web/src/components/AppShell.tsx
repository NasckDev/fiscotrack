import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { NAV_ITEMS, TAB_ITEMS } from '../navigation';
import { DB_ISSUE_EVENT } from '../storage/operationsRepository';
import {
  AppAvatar,
  AppButton,
  AppContainer,
  AppDivider,
  AppDrawer,
  AppDropdown,
  AppIconButton,
  AppLayout,
  AppLayoutContent,
  AppLayoutHeader,
  AppLayoutSider,
  AppMenu,
  AppStack,
  AppTabBar,
  AppText,
  setTheme,
  useAppColors,
  useBreakpoints,
  useTheme,
  useToasts,
  type AppMenuItem,
} from '../ui';
import { CommandPalette } from './CommandPalette';
import { Disclaimer } from './Disclaimer';
import { ExampleBanner, FirstVisitLoader } from './ExampleBanner';
import { Logo, LogoMark } from './Logo';
import { Notifications } from './Notifications';
import { ShortcutsModal } from './ShortcutsModal';

const REPOSITORY_URL = 'https://github.com/NasckDev/fiscotrack';
const GO_SEQUENCE_MS = 1200;
const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 80;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

interface ShellActions {
  readonly openPalette: () => void;
  readonly openShortcuts: () => void;
}

/** Item de menu ativo: `/carteira/PETR4` destaca "Carteira". */
function activeKey(pathname: string): string {
  const match = NAV_ITEMS.filter((item) => item.to !== '/' && pathname.startsWith(item.to));
  return match[0]?.to ?? (pathname === '/' ? '/' : '');
}

function useNavMenuItems(afterSelect?: () => void): readonly AppMenuItem[] {
  const navigate = useNavigate();
  return NAV_ITEMS.map((item) => ({
    key: item.to,
    label: item.label,
    icon: item.icon,
    onSelect: () => {
      void navigate(item.to);
      afterSelect?.();
    },
  }));
}

function SiderContent({ collapsed }: { readonly collapsed: boolean }) {
  const { pathname } = useLocation();
  const colors = useAppColors();
  const items = useNavMenuItems();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      <div style={{ padding: '0 8px 20px' }}>
        <Logo onDark compact={collapsed} />
      </div>
      <nav aria-label="Principal">
        <AppMenu
          items={items}
          selectedKey={activeKey(pathname)}
          theme="dark"
          collapsed={collapsed}
        />
      </nav>
      {!collapsed && (
        <div
          style={{
            marginTop: 'auto',
            padding: 14,
            borderRadius: 14,
            background: colors.siderSelectedBg,
            color: colors.siderText,
            fontSize: 13,
          }}
        >
          <strong style={{ color: colors.siderSelectedText }}>Dados só no navegador</strong>
          <div style={{ marginTop: 4 }}>
            Nada é enviado a servidores; sem contas nem telemetria.
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderSearch({
  openPalette,
  wide,
}: Pick<ShellActions, 'openPalette'> & { readonly wide: boolean }) {
  if (!wide) return <AppIconButton icon="search" label="Buscar" onClick={openPalette} />;
  return (
    <AppButton icon="search" onClick={openPalette} aria-label="Buscar telas, ações e ativos">
      <span style={{ display: 'inline-flex', gap: 24, color: 'inherit' }}>
        <span>Buscar…</span>
        <kbd style={{ fontFamily: 'inherit', fontSize: 12 }}>Ctrl K</kbd>
      </span>
    </AppButton>
  );
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
      key: 'rules',
      label: 'Regras e premissas',
      icon: 'rules',
      onSelect: () => void navigate('/regras'),
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
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppAvatar initials="VC" label="Você" />
      </button>
    </AppDropdown>
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

function MobileNavDrawer({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items: readonly AppMenuItem[] = [
    ...useNavMenuItems(onClose),
    {
      key: '/importar',
      label: 'Importar CSV',
      icon: 'upload',
      dividerBefore: true,
      onSelect: () => {
        void navigate('/importar');
        onClose();
      },
    },
  ];
  return (
    <AppDrawer open={open} title="Menu" onClose={onClose} placement="left" size="sm">
      <nav aria-label="Menu completo">
        <AppMenu items={items} selectedKey={activeKey(pathname)} />
      </nav>
    </AppDrawer>
  );
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const screens = useBreakpoints();
  const isDesktop = Boolean(screens.lg);
  const isPhone = !screens.md;
  const colors = useAppColors();
  const theme = useTheme();
  const toasts = useToasts();
  const [collapsed, setCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <AppLayout style={{ minHeight: '100vh' }}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      {isDesktop && (
        <AppLayoutSider
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          collapsed={collapsed}
          trigger={null}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
        >
          <SiderContent collapsed={collapsed} />
        </AppLayoutSider>
      )}
      <AppLayout>
        <AppLayoutHeader
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: isPhone ? '0 12px' : '0 24px',
            borderBottom: `1px solid ${colors.borderSoft}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDesktop ? (
              <AppIconButton
                icon="menu"
                label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                aria-pressed={collapsed}
                onClick={() => setCollapsed((value) => !value)}
              />
            ) : (
              <>
                <AppIconButton
                  icon="menu"
                  label="Abrir menu"
                  aria-haspopup="dialog"
                  onClick={() => setIsMenuOpen(true)}
                />
                <LogoMark size={30} />
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HeaderSearch openPalette={openPalette} wide={isDesktop} />
            <Notifications />
            <AppIconButton
              icon={theme === 'dark' ? 'sun' : 'moon'}
              label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <AccountMenu openShortcuts={openShortcuts} />
          </div>
        </AppLayoutHeader>
        <FirstVisitLoader />
        <AppLayoutContent
          id="conteudo"
          tabIndex={-1}
          style={{
            outline: 'none',
            paddingBottom: isPhone ? 'calc(72px + env(safe-area-inset-bottom))' : 0,
          }}
        >
          <AppContainer>
            <AppStack gap="small">
              <Disclaimer />
              <ExampleBanner />
            </AppStack>
            <div style={{ height: 16 }} />
            {children}
          </AppContainer>
          <footer style={{ textAlign: 'center', padding: '0 16px 24px' }}>
            <AppDivider />
            <AppText type="secondary" size="sm">
              Projeto open source educacional · MIT ·{' '}
            </AppText>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary, textDecoration: 'underline' }}
            >
              GitHub
            </a>
          </footer>
        </AppLayoutContent>
      </AppLayout>
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
      <MobileNavDrawer open={isMenuOpen && !isDesktop} onClose={() => setIsMenuOpen(false)} />
      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onShowShortcuts={openShortcuts}
      />
      <ShortcutsModal open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </AppLayout>
  );
}
