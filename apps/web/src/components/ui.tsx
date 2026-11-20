import { formatBRL } from '@fiscotrack/engine';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Classe de cor semântica para valores com sinal: negativo em rosa, positivo em verde. */
export function signedToneClass(cents: number): string {
  if (cents < 0) return 'text-danger';
  if (cents > 0) return 'text-success';
  return 'text-ink';
}

interface MoneyProps {
  readonly cents: number;
  /** Colore o valor conforme o sinal (resultado financeiro). */
  readonly signed?: boolean;
  readonly className?: string;
}

export function Money({ cents, signed = false, className = '' }: MoneyProps) {
  const tone = signed ? signedToneClass(cents) : '';
  return <span className={`num ${tone} ${className}`.trim()}>{formatBRL(cents)}</span>;
}

interface PageHeaderProps {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description !== undefined && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

type NoticeTone = 'warning' | 'danger' | 'info' | 'success';

const NOTICE_STYLES: Record<NoticeTone, { box: string; icon: IconName; iconTone: string }> = {
  warning: { box: 'border-warning/40 bg-warning-surface', icon: 'alert', iconTone: 'text-warning' },
  danger: { box: 'border-danger/40 bg-danger-surface', icon: 'alert', iconTone: 'text-danger' },
  info: { box: 'border-info/40 bg-info-surface', icon: 'info', iconTone: 'text-info' },
  success: {
    box: 'border-success/40 bg-success-surface',
    icon: 'check-circle',
    iconTone: 'text-success',
  },
};

interface NoticeProps {
  readonly tone: NoticeTone;
  readonly title: string;
  readonly role?: 'alert' | 'status';
  readonly children?: ReactNode;
}

export function Notice({ tone, title, role, children }: NoticeProps) {
  const style = NOTICE_STYLES[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-xl border p-4 ${style.box}`}>
      <Icon name={style.icon} className={`mt-0.5 flex-none ${style.iconTone}`} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-ink">{title}</p>
        {children !== undefined && <div className="mt-1 text-ink">{children}</div>}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }: { readonly className: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

interface KpiProps {
  readonly label: string;
  readonly icon: IconName;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
}

/** Indicador: rótulo com ícone, valor grande em fonte tabular e dica. */
export function Kpi({ label, icon, hint, children }: KpiProps) {
  return (
    <div className="card flex h-full flex-col p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted sm:text-sm">
        <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-accent-surface text-accent">
          <Icon name={icon} size={16} />
        </span>
        {label}
      </p>
      <p className="mt-3 text-lg font-bold tracking-tight whitespace-nowrap sm:text-xl xl:text-2xl">
        {children}
      </p>
      {hint !== undefined && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_ICON: Record<StatusTone, IconName> = {
  success: 'check-circle',
  warning: 'clock',
  danger: 'circle-alert',
  info: 'info',
  neutral: 'check',
};

/** Selo de status: sempre com ícone e texto, para a cor nunca ser o único sinal. */
export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className={`badge badge-${tone}`}>
      <Icon name={STATUS_ICON[tone]} size={13} />
      {children}
    </span>
  );
}
