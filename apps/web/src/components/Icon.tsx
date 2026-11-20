import {
  ArrowLeft,
  ArrowLeftRight,
  Calculator,
  CalendarClock,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Command,
  Download,
  Ellipsis,
  ExternalLink,
  FileText,
  Home,
  Info,
  Keyboard,
  Moon,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Table2,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Undo2,
  Upload,
  Wallet,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const ICONS = {
  home: Home,
  wallet: Wallet,
  operations: ArrowLeftRight,
  calculator: Calculator,
  receipt: Receipt,
  rules: Scale,
  settings: Settings,
  upload: Upload,
  sun: Sun,
  moon: Moon,
  x: X,
  trash: Trash2,
  alert: TriangleAlert,
  'circle-alert': CircleAlert,
  check: Check,
  'check-circle': CircleCheck,
  info: Info,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  download: Download,
  table: Table2,
  chart: ChartColumn,
  plus: Plus,
  external: ExternalLink,
  file: FileText,
  sparkles: Sparkles,
  shield: ShieldCheck,
  search: Search,
  pencil: Pencil,
  undo: Undo2,
  printer: Printer,
  command: Command,
  keyboard: Keyboard,
  more: Ellipsis,
  clock: CalendarClock,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  'arrow-left': ArrowLeft,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  readonly name: IconName;
  readonly size?: number;
}

/** Ícone decorativo (lucide); o rótulo acessível fica no elemento que o contém. */
export function Icon({ name, size = 20, ...props }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component size={size} strokeWidth={1.75} aria-hidden="true" focusable="false" {...props} />
  );
}
