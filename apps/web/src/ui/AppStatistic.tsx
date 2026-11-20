import { Statistic } from 'antd';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { MONO_STYLE } from './monoStyle';
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
}: AppStatisticProps) {
  const colors = useAppColors();
  const shown = useCountUp(value, animated);
  const color = { default: undefined, gain: colors.gain, loss: colors.loss, darf: colors.darf }[
    tone
  ];
  return (
    <div>
      <Statistic
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {icon && <AppIcon name={icon} />}
            {title}
          </span>
        }
        value={shown}
        formatter={(raw) => format(Number(raw))}
        loading={loading}
        styles={{ content: { ...MONO_STYLE, fontWeight: 700, color } }}
      />
      {hint !== undefined && (
        <div style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }}>{hint}</div>
      )}
    </div>
  );
}
