import { formatBRL } from '@fiscotrack/engine';
import { AppText } from './AppTypography';

interface AppMoneyProps {
  readonly cents: number;
  /** Colore o valor conforme o sinal (resultado financeiro). */
  readonly signed?: boolean;
  readonly strong?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly block?: boolean;
}

/** Valor em reais (recebe centavos) em fonte mono tabular. */
export function AppMoney({ cents, signed = false, ...props }: AppMoneyProps) {
  const tone = signed ? (cents < 0 ? 'loss' : cents > 0 ? 'gain' : undefined) : undefined;
  return (
    <AppText mono tone={tone} {...props}>
      {formatBRL(cents)}
    </AppText>
  );
}
