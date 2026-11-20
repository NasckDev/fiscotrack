import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { NAV_ITEMS } from '../navigation';
import { setTheme, useTheme } from '../theme';
import { useFinance } from '../state/useFinance';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

interface Command {
  readonly id: string;
  readonly group: 'Ir para' | 'Ações' | 'Ativos';
  readonly label: string;
  readonly icon: IconName;
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
  const { holdings } = useFinance();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

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
        icon: 'keyboard',
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
      <div className="relative">
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute top-3.5 left-3 text-muted"
        />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[current] ? `palette-${results[current].id}` : undefined}
          aria-label="Buscar telas, ações e ativos"
          placeholder="Buscar telas, ações e ativos…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={handleKey}
          className="input pl-10"
        />
      </div>
      <ul
        id="palette-list"
        role="listbox"
        aria-label="Resultados"
        className="mt-3 max-h-80 overflow-y-auto"
      >
        {results.length === 0 && (
          <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">
            Nada encontrado para “{query}”.
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
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
              index === current ? 'bg-accent-surface text-accent' : ''
            }`}
          >
            <Icon name={command.icon} size={18} />
            <span className="flex-1 font-semibold">{command.label}</span>
            <span className="text-xs text-muted">{command.group}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Paleta de comandos (Ctrl/⌘ K): telas, ações e ativos com busca sem acento. */
export function CommandPalette({ open, onClose, onShowShortcuts }: CommandPaletteProps) {
  return (
    <Modal open={open} title="Paleta de comandos" onClose={onClose} placement="top">
      <PaletteBody onClose={onClose} onShowShortcuts={onShowShortcuts} />
    </Modal>
  );
}
