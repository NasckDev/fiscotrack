import { Tag } from 'antd';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { useAppColors } from './theme/AppThemeProvider';

export type AppTagTone = 'neutral' | 'gain' | 'loss' | 'darf' | 'info' | 'primary';

interface AppTagProps {
  readonly children: ReactNode;
  readonly tone?: AppTagTone;
  readonly icon?: AppIconName;
}

function useTagColors(tone: AppTagTone) {
  const c = useAppColors();
  return {
    neutral: { fg: c.text, bg: c.bgSubtle },
    gain: { fg: c.gain, bg: c.gainSurface },
    loss: { fg: c.loss, bg: c.lossSurface },
    darf: { fg: c.darf, bg: c.darfSurface },
    info: { fg: c.info, bg: c.infoSurface },
    primary: { fg: c.primary, bg: c.primarySurface },
  }[tone];
}

/** Etiqueta de categoria (por exemplo, "Day trade"). */
export function AppTag({ children, tone = 'neutral', icon }: AppTagProps) {
  const { fg, bg } = useTagColors(tone);
  return (
    <Tag variant="filled" style={{ color: fg, background: bg, margin: 0, fontWeight: 600 }}>
      {icon && (
        <>
          <AppIcon name={icon} />{' '}
        </>
      )}
      {children}
    </Tag>
  );
}

export type AppStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS: Record<AppStatusTone, { tone: AppTagTone; icon: AppIconName }> = {
  success: { tone: 'gain', icon: 'check-circle' },
  warning: { tone: 'darf', icon: 'clock' },
  danger: { tone: 'loss', icon: 'circle-alert' },
  info: { tone: 'info', icon: 'info' },
  neutral: { tone: 'neutral', icon: 'check' },
};

/** Selo de status: sempre com ícone e texto, para a cor nunca ser o único sinal. */
export function AppStatus({
  tone,
  children,
}: {
  readonly tone: AppStatusTone;
  readonly children: ReactNode;
}) {
  const view = STATUS[tone];
  return (
    <AppTag tone={view.tone} icon={view.icon}>
      {children}
    </AppTag>
  );
}
