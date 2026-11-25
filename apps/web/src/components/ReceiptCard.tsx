import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { formatMonth } from '../domain/format';
import { buildReceipt, shortSourceTitle } from '../domain/receipt';
import { AppLink, NUMERIC_STYLE, useAppColors } from '../ui';

export const RECEIPT_HEADING_ID = 'por-que-deu-esse-valor';

/**
 * "Por que deu esse valor?" com cara de recibo: linhas com separador tracejado, total em 800 e
 * selo com a fonte legal. Os valores vêm do motor de cálculo (`buildReceipt` só reorganiza).
 */
export function ReceiptCard({ month }: { readonly month: MonthlyResult }) {
  const colors = useAppColors();
  const receipt = buildReceipt(month);
  const dashed = `1.5px dashed ${colors.borderSoft}`;

  return (
    <section
      aria-labelledby={RECEIPT_HEADING_ID}
      className="ft-receipt"
      style={{
        background: colors.bgContainer,
        borderRadius: 'var(--ft-radius-card)',
        padding: 'clamp(18px, 4.5vw, 26px) clamp(18px, 4.5vw, 26px) 38px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: '4px 12px',
          marginBottom: 10,
        }}
      >
        <h2
          id={RECEIPT_HEADING_ID}
          tabIndex={-1}
          style={{ margin: 0, fontSize: 20, fontWeight: 800, outlineOffset: 4 }}
        >
          Por que deu esse valor?
        </h2>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Apuração de {formatMonth(receipt.month)}
        </span>
      </div>
      <dl style={{ margin: 0 }}>
        {receipt.lines.map((line) => (
          <div
            key={line.label}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              columnGap: 10,
              padding: '10px 0',
              borderBottom: dashed,
              fontSize: 14,
            }}
          >
            <dt>{line.label}</dt>
            <dd style={{ margin: 0, fontWeight: 800, ...NUMERIC_STYLE }}>{line.value}</dd>
            {line.note && (
              <dd
                style={{
                  gridColumn: '1 / -1',
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {line.note}
              </dd>
            )}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            padding: '14px 0 6px',
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          <dt>{receipt.totalLabel}</dt>
          <dd style={{ margin: 0, ...NUMERIC_STYLE }}>{formatBRL(receipt.totalCents)}</dd>
        </div>
      </dl>
      {receipt.totalNote && (
        <span style={{ fontSize: 12, color: colors.textMuted }}>{receipt.totalNote}</span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {receipt.sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className="ft-chip"
            style={{ background: colors.bgSubtle, color: colors.text }}
          >
            Fonte: {shortSourceTitle(source.title)}
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>
        <AppLink to={`/apuracao?mes=${receipt.month}`}>Ver o passo a passo completo</AppLink>
      </div>
    </section>
  );
}
