import { Skeleton } from 'antd';

interface AppSkeletonProps {
  /** `text`: título e parágrafos; `block`: retângulo; `table`: linhas de tabela. */
  readonly variant?: 'text' | 'block' | 'table';
  readonly rows?: number;
  readonly active?: boolean;
  /** Texto lido por leitores de tela. */
  readonly label?: string;
}

/** Esqueleto de carregamento com o formato do conteúdo. */
export function AppSkeleton({
  variant = 'text',
  rows = 3,
  active = true,
  label = 'Carregando…',
}: AppSkeletonProps) {
  return (
    <div role="status" aria-live="polite">
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div aria-hidden="true">
        {variant === 'block' && (
          <Skeleton.Node active={active} style={{ width: '100%', height: 160 }}>
            <span />
          </Skeleton.Node>
        )}
        {variant === 'text' && <Skeleton active={active} paragraph={{ rows }} />}
        {variant === 'table' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {Array.from({ length: rows }, (_, index) => (
              <Skeleton.Input key={index} active={active} block />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
