import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useState, type ReactNode } from 'react';
import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppFlex } from '../AppLayout';
import { AppTable, type AppTableColumn } from '../AppTable';
import { AppText } from '../AppTypography';
import { useAppColors, useReducedMotion } from '../theme/AppThemeProvider';
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
    textStyle: { fontFamily: 'inherit', color: colors.textMuted },
    ...option,
  };

  return (
    <AppCard fullHeight aria-label={title}>
      <figure style={{ margin: 0 }}>
        <AppFlex justify="space-between" align="flex-start" gap="middle" wrap>
          <div>
            <figcaption style={{ fontWeight: 700, fontSize: 16 }}>{title}</figcaption>
            {legend}
          </div>
          <AppButton
            size="sm"
            icon={showTable ? 'chart' : 'table'}
            aria-pressed={showTable}
            onClick={() => setShowTable((value) => !value)}
          >
            {showTable ? 'Ver gráfico' : 'Ver como tabela'}
          </AppButton>
        </AppFlex>
        <div style={{ marginTop: 16 }}>
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
  return (
    <ul
      aria-label="Legenda"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 16px',
        listStyle: 'none',
        margin: '6px 0 0',
        padding: 0,
      }}
    >
      {items.map((item) => (
        <li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{ width: 10, height: 10, borderRadius: 3, background: item.color }}
          />
          <AppText type="secondary" size="sm">
            {item.label}
          </AppText>
        </li>
      ))}
    </ul>
  );
}
