import { Progress } from 'antd';
import { useAppColors } from './theme/AppThemeProvider';

interface AppProgressProps {
  /** De 0 a 100. */
  readonly percent: number;
  readonly label: string;
  /** Texto lido por leitores de tela, por exemplo "40% do limite usado". */
  readonly valueText?: string;
  readonly tone?: 'gain' | 'darf' | 'loss';
}

export function AppProgress({ percent, label, valueText, tone = 'gain' }: AppProgressProps) {
  const colors = useAppColors();
  const color = { gain: colors.gainFill, darf: colors.darfBar, loss: colors.lossFill }[tone];
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={valueText}
    >
      <Progress
        percent={clamped}
        showInfo={false}
        strokeColor={color}
        railColor={colors.bgSubtle}
        aria-hidden="true"
      />
    </div>
  );
}
