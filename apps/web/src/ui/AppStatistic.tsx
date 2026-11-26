import { Statistic } from 'antd';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { NUMERIC_STYLE } from './monoStyle';
import { useAppColors } from './theme/AppThemeProvider';
import { useCountUp } from './useCountUp';

export type AppStatisticTone = 'default' | 'gain' | 'loss' | 'darf';

interface AppStatisticProps {
  readonly title: ReactNode;
  /** Valor numérico (por exemplo, centavos). */
  readonly value: number;
  /** Converte o valor em texto (moeda, quantidade). */
  readonly format?: (value: number) => string;
  readonly icon?: AppIconName;
  /** Cor do valor; use `gain` e `loss` para resultados com sinal. */
  readonly tone?: AppStatisticTone;
  /** Texto de apoio abaixo do valor. */
  readonly hint?: ReactNode;
  readonly loading?: boolean;
  /** Faz o valor subir até o número final (desligado com "reduzir movimento"). */
  readonly animated?: boolean;
  /** `lg`: valor de cartão em destaque (40 px). */
  readonly size?: 'md' | 'lg';
}

export function AppStatistic({
  title,
  value,
  format = String,
  icon,
  tone = 'default',
  hint,
  loading = false,
  animated = false,
  size = 'md',
}: AppStatisticProps) {
  const colors = useAppColors();
  const shown = useCountUp(value, animated);
  const color = { default: undefined, gain: colors.gain, loss: colors.loss, darf: colors.darf }[
    tone
  ];
  // O valor encolhe para caber na largura do cartão (unidade cqi), sem cortar nem quebrar.
  const chars = Math.max(format(value).length, 4);
  const base = size === 'lg' ? 40 : 32;
  return (
    <div style={{ containerType: 'inline-size', minWidth: 0 }}>
      <Statistic
        title={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              color: colors.textMuted,
            }}
          >
            {icon && <AppIcon name={icon} />}
            {title}
          </span>
        }
        value={shown}
        formatter={(raw) => format(Number(raw))}
        loading={loading}
        styles={{
          content: {
            ...NUMERIC_STYLE,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            fontSize: `min(${base}px, calc(100cqi / ${(chars * 0.6).toFixed(2)}))`,
            whiteSpace: 'nowrap',
            color,
          },
        }}
      />
      {hint !== undefined && (
        <div style={{ marginTop: 6, fontSize: 14, color: colors.textMuted }}>{hint}</div>
      )}
    </div>
  );
}
