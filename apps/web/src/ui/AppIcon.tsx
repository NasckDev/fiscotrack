import {
  ArrowLeftOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  FallOutlined,
  FileTextOutlined,
  FilterOutlined,
  GithubOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  MoonOutlined,
  PieChartOutlined,
  PlusOutlined,
  PrinterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  SwapOutlined,
  TableOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  UploadOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { CSSProperties } from 'react';

const ICONS = {
  home: HomeOutlined,
  wallet: WalletOutlined,
  operations: SwapOutlined,
  calculator: CalculatorOutlined,
  calendar: CalendarOutlined,
  receipt: AuditOutlined,
  rules: BookOutlined,
  settings: SettingOutlined,
  upload: UploadOutlined,
  sun: SunOutlined,
  moon: MoonOutlined,
  x: CloseOutlined,
  trash: DeleteOutlined,
  alert: WarningOutlined,
  'circle-alert': ExclamationCircleOutlined,
  check: CheckOutlined,
  'check-circle': CheckCircleOutlined,
  info: InfoCircleOutlined,
  'chevron-down': DownOutlined,
  'chevron-right': RightOutlined,
  download: DownloadOutlined,
  table: TableOutlined,
  chart: BarChartOutlined,
  pie: PieChartOutlined,
  plus: PlusOutlined,
  external: ExportOutlined,
  file: FileTextOutlined,
  sparkles: ThunderboltOutlined,
  shield: SafetyCertificateOutlined,
  search: SearchOutlined,
  pencil: EditOutlined,
  undo: UndoOutlined,
  printer: PrinterOutlined,
  help: QuestionCircleOutlined,
  more: EllipsisOutlined,
  clock: ClockCircleOutlined,
  'trend-up': RiseOutlined,
  'trend-down': FallOutlined,
  'arrow-left': ArrowLeftOutlined,
  bell: BellOutlined,
  menu: MenuOutlined,
  github: GithubOutlined,
  filter: FilterOutlined,
  reload: ReloadOutlined,
} as const;

export type AppIconName = keyof typeof ICONS;

export const APP_ICON_NAMES = Object.keys(ICONS) as readonly AppIconName[];

interface AppIconProps {
  readonly name: AppIconName;
  /** Tamanho em px; por padrão herda o tamanho da fonte. */
  readonly size?: number;
  readonly style?: CSSProperties;
}

/** Ícone decorativo (Ant Design Icons); o rótulo acessível fica no elemento que o contém. */
export function AppIcon({ name, size, style }: AppIconProps) {
  const Component = ICONS[name];
  return (
    <Component
      aria-hidden="true"
      style={size === undefined ? style : { fontSize: size, ...style }}
    />
  );
}
