import { Steps } from 'antd';
import type { ReactNode } from 'react';
import { useIsMobile } from './theme/AppThemeProvider';

export interface AppStepItem {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly status?: 'wait' | 'process' | 'finish' | 'error';
}

interface AppStepsProps {
  readonly items: readonly AppStepItem[];
  /** Índice (a partir de 0) da etapa atual. */
  readonly current: number;
  readonly size?: 'sm' | 'md';
  /** Força a vertical (explicações longas); por padrão só no celular. */
  readonly vertical?: boolean;
  readonly 'aria-label'?: string;
}

/** Etapas de um fluxo. No celular ficam na vertical. */
export function AppSteps({
  items,
  current,
  size = 'md',
  vertical = false,
  ...props
}: AppStepsProps) {
  const isMobile = useIsMobile();
  return (
    <div role="group" {...props}>
      <Steps
        current={current}
        size={size === 'sm' ? 'small' : 'default'}
        orientation={isMobile || vertical ? 'vertical' : 'horizontal'}
        items={items.map((item) => ({ ...item }))}
      />
    </div>
  );
}
