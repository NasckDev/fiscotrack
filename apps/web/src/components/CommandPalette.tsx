import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { NAV_ITEMS } from '../navigation';
import { useFinance } from '../state/useFinance';
import {
  AppIcon,
  AppInput,
  AppModal,
  AppText,
  setTheme,
  useAppColors,
  useTheme,
  type AppIconName,
} from '../ui';

interface Command {
  readonly id: string;
  readonly group: 'Ir para' | 'Ações' | 'Ativos';
  readonly label: string;
  readonly icon: AppIconName;
  readonly run: () => void;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onShowShortcuts: () => void;
}

function PaletteBody({ onClose, onShowShortcuts }: Omit<CommandPaletteProps, 'open'>) {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = useAppColors();
  const { holdings } = useFinance();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // O diálogo move o foco para si ao abrir; devolvemos o foco ao campo de busca.
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById('palette-input')?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const commands = useMemo<readonly Command[]>(() => {
    const go = (to: string) => () => void navigate(to);
    return [
      ...NAV_ITEMS.map((item): Command => ({
        id: `nav-${item.to}`,
        group: 'Ir para',
        label: item.label,
        icon: item.icon,
        run: go(item.to),
      })),
      {
        id: 'new',
        group: 'Ações',
        label: 'Nova operação',
        icon: 'plus',
        run: go('/operacoes?nova=1'),
      },
      { id: 'import', group: 'Ações', label: 'Importar CSV', icon: 'upload', run: go('/importar') },
      {
        id: 'theme',
        group: 'Ações',
        label: theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro',
        icon: theme === 'dark' ? 'sun' : 'moon',
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'keys',
        group: 'Ações',
        label: 'Ver atalhos de teclado',
        icon: 'help',
        run: onShowShortcuts,
      },
      ...holdings.map((holding): Command => ({
        id: `asset-${holding.ticker}`,
        group: 'Ativos',
        label: holding.ticker,
        icon: 'wallet',
        run: go(`/carteira/${holding.ticker}`),
      })),
    ];
  }, [navigate, theme, holdings, onShowShortcuts]);

  const results = commands.filter((command) =>
    normalize(command.label).includes(normalize(query.trim())),
  );
  const current = Math.min(active, Math.max(results.length - 1, 0));

  const execute = (command: Command | undefined) => {
    if (command === undefined) return;
    onClose();
    command.run();
  };

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(results[current]);
    }
  };

  return (
    <div>
      <AppInput
        autoFocus
        id="palette-input"
        role="combobox"
        aria-expanded
        aria-controls="palette-list"
        aria-activedescendant={results[current] ? `palette-${results[current].id}` : undefined}
        aria-label="Buscar telas, ações e ativos"
        placeholder="Buscar telas, ações e ativos…"
        prefix={<AppIcon name="search" />}
        size="lg"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={handleKey}
      />
      <ul
        id="palette-list"
        role="listbox"
        aria-label="Resultados"
        style={{
          listStyle: 'none',
          margin: '12px 0 0',
          padding: 0,
          maxHeight: 320,
          overflowY: 'auto',
        }}
      >
        {results.length === 0 && (
          <li role="presentation" style={{ padding: '24px 12px', textAlign: 'center' }}>
            <AppText type="secondary">
              Nada encontrado para “{query}”. Tente o nome de uma tela ou de um ativo.
            </AppText>
          </li>
        )}
        {results.map((command, index) => (
          <li
            key={command.id}
            id={`palette-${command.id}`}
            role="option"
            aria-selected={index === current}
            onClick={() => execute(command)}
            onMouseMove={() => setActive(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              background: index === current ? colors.primarySurface : 'transparent',
              color: index === current ? colors.primary : colors.text,
            }}
          >
            <AppIcon name={command.icon} />
            <span style={{ flex: 1, fontWeight: 600 }}>{command.label}</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>{command.group}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Paleta de comandos (Ctrl/⌘ K): telas, ações e ativos com busca sem acento. */
export function CommandPalette({ open, onClose, onShowShortcuts }: CommandPaletteProps) {
  return (
    <AppModal open={open} title="Paleta de comandos" onClose={onClose} placement="top">
      <PaletteBody onClose={onClose} onShowShortcuts={onShowShortcuts} />
    </AppModal>
  );
}
