import type { IconName } from './components/Icon';

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: IconName;
  /** Tecla após "g" para ir direto à tela. */
  readonly goKey: string;
}

/** Telas principais, na ordem da barra lateral. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Início', shortLabel: 'Início', icon: 'home', goKey: 'i' },
  { to: '/carteira', label: 'Carteira', shortLabel: 'Carteira', icon: 'wallet', goKey: 'c' },
  { to: '/operacoes', label: 'Operações', shortLabel: 'Operações', icon: 'operations', goKey: 'o' },
  {
    to: '/apuracao',
    label: 'Apuração mensal',
    shortLabel: 'Apuração',
    icon: 'calculator',
    goKey: 'a',
  },
  { to: '/darfs', label: 'DARFs', shortLabel: 'DARFs', icon: 'receipt', goKey: 'd' },
  { to: '/regras', label: 'Regras', shortLabel: 'Regras', icon: 'rules', goKey: 'r' },
  { to: '/config', label: 'Configurações', shortLabel: 'Config.', icon: 'settings', goKey: 'e' },
];

/** Itens da barra inferior no celular; o resto fica em "Mais". */
export const TAB_ITEMS: readonly NavItem[] = NAV_ITEMS.slice(0, 4);

export const SHORTCUTS: readonly { keys: readonly string[]; label: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Abrir a paleta de comandos (⌘ K no Mac)' },
  { keys: ['?'], label: 'Mostrar esta lista de atalhos' },
  { keys: ['N'], label: 'Nova operação' },
  ...NAV_ITEMS.map((item) => ({
    keys: ['G', item.goKey.toUpperCase()],
    label: `Ir para ${item.label}`,
  })),
  { keys: ['Esc'], label: 'Fechar diálogos e a paleta' },
];
