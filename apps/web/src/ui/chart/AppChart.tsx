import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useState, type ReactNode } from 'react';
import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppFlex } from '../AppLayout';
import { AppTable, type AppTableColumn } from '../AppTable';
import { useAppColors, useReducedMotion } from '../theme/AppThemeProvider';
import { FONT_SANS } from '../theme/palette';
import { echarts } from './echarts';

export type AppChartOption = EChartsCoreOption;

export interface AppChartTable {
  readonly head: readonly string[];
  readonly rows: readonly (readonly ReactNode[])[];
}

interface AppChartProps {
  readonly title: string;
  /** Descrição textual lida por leitores de tela. */
  readonly description: string;
  readonly option: AppChartOption;
  /** Altura do gráfico em px. */
  readonly height?: number;
  /** Alternativa em tabela, sempre equivalente ao gráfico. */
  readonly table: AppChartTable;
  readonly legend?: ReactNode;
  readonly loading?: boolean;
}

/**
 * Moldura de gráfico em ECharts: título, legenda, descrição para leitor de tela e botão
 * "Ver como tabela". A animação de entrada some com "reduzir movimento".
 */
export function AppChart({
  title,
  description,
  option,
  height = 280,
  table,
  legend,
  loading = false,
}: AppChartProps) {
  const [showTable, setShowTable] = useState(false);
  const colors = useAppColors();
  const reduced = useReducedMotion();
  const columns: readonly AppTableColumn<readonly ReactNode[]>[] = table.head.map(
    (title, index) => ({
      title,
      key: String(index),
      align: index === 0 ? 'left' : 'right',
      render: (_: unknown, row: readonly ReactNode[]) => row[index],
    }),
  );
  const merged: AppChartOption = {
    animation: !reduced,
    animationDuration: 700,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT_SANS, color: colors.textMuted },
    ...option,
  };

  return (
    <AppCard fullHeight aria-label={title}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AppFlex justify="space-between" align="center" gap="middle" wrap>
          <figcaption style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}>
            {title}
          </figcaption>
          <AppFlex align="center" gap="middle" wrap>
            {legend}
            <AppButton
              size="sm"
              icon={showTable ? 'chart' : 'table'}
              aria-pressed={showTable}
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? 'Ver gráfico' : 'Ver como tabela'}
            </AppButton>
          </AppFlex>
        </AppFlex>
        <div>
          {showTable ? (
            <AppTable
              size="sm"
              ariaLabel={`Tabela: ${title}`}
              columns={columns}
              data={table.rows}
              rowKey={(row) => String(row[0])}
            />
          ) : (
            <div role="img" aria-label={description}>
              <ReactEChartsCore
                echarts={echarts}
                option={merged}
                notMerge
                showLoading={loading}
                opts={{ renderer: 'svg' }}
                style={{ height, width: '100%' }}
              />
            </div>
          )}
        </div>
      </figure>
    </AppCard>
  );
}

/** Item de legenda (cor + rótulo). */
export function AppChartLegend({
  items,
}: {
  readonly items: readonly { color: string; label: string }[];
}) {
  const colors = useAppColors();
  return (
    <ul
      aria-label="Legenda"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 14px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {items.map((item) => (
        <li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{ width: 10, height: 10, borderRadius: 3, background: item.color }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
