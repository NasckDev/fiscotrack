import { useAppColors } from '../theme/AppThemeProvider';
import { FONT_MONO } from '../theme/palette';
import type { Palette } from '../theme/palette';
import { AppChart, AppChartLegend, type AppChartTable } from './AppChart';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

interface TooltipRow {
  readonly color: string;
  readonly label: string;
  readonly value: string;
}

/** HTML do tooltip (só texto escapado) com a tipografia mono dos valores. */
function tooltipHtml(title: string, rows: readonly TooltipRow[]): string {
  const lines = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">` +
        `<span style="width:10px;height:10px;border-radius:3px;background:${row.color}"></span>` +
        `<span style="flex:1">${escapeHtml(row.label)}</span>` +
        `<span style="font-family:${FONT_MONO};font-variant-numeric:tabular-nums;font-weight:700">${escapeHtml(row.value)}</span></div>`,
    )
    .join('');
  return `<div style="min-width:170px"><div style="font-weight:700">${escapeHtml(title)}</div>${lines}</div>`;
}

function tooltipBase(colors: Palette) {
  return {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    padding: 12,
    textStyle: { color: colors.text, fontSize: 13 },
    extraCssText: 'border-radius:12px;box-shadow:0 8px 24px rgb(0 0 0 / 0.18);',
  };
}

function axisBase(colors: Palette) {
  return {
    axisLine: { lineStyle: { color: colors.chartGrid } },
    axisTick: { show: false },
    axisLabel: { color: colors.textMuted, fontSize: 12 },
  };
}

interface Common {
  readonly title: string;
  readonly description: string;
  readonly table: AppChartTable;
  readonly height?: number;
}

/* ---------- Barras ---------- */

export interface BarSeries {
  readonly name: string;
  readonly values: readonly number[];
  /** Cor única da série ou uma cor por barra. */
  readonly color: string | readonly string[];
  /** Rótulo no tooltip por ponto (por exemplo "Lucro" ou "Prejuízo"). */
  readonly labelAt?: (index: number) => string;
}

interface AppBarChartProps extends Common {
  readonly categories: readonly string[];
  readonly tooltipTitles: readonly string[];
  readonly series: readonly BarSeries[];
  readonly formatValue: (value: number) => string;
  readonly formatAxis: (value: number) => string;
  readonly legend: readonly { color: string; label: string }[];
}

export function AppBarChart({
  categories,
  tooltipTitles,
  series,
  formatValue,
  formatAxis,
  legend,
  ...common
}: AppBarChartProps) {
  const colors = useAppColors();
  const option = {
    grid: { top: 16, right: 8, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      ...tooltipBase(colors),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: colors.primarySurface, opacity: 0.6 } },
      formatter: (params: unknown) => {
        const first = (params as { dataIndex: number }[])[0];
        const index = first?.dataIndex ?? 0;
        return tooltipHtml(
          tooltipTitles[index] ?? '',
          series.map((item) => ({
            color:
              typeof item.color === 'string' ? item.color : (item.color[index] ?? colors.primary),
            label: item.labelAt?.(index) ?? item.name,
            value: formatValue(item.values[index] ?? 0),
          })),
        );
      },
    },
    xAxis: { type: 'category', data: [...categories], ...axisBase(colors) },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.textMuted, fontSize: 12, formatter: formatAxis },
      splitLine: { lineStyle: { color: colors.chartGrid } },
    },
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      barMaxWidth: 28,
      itemStyle: { borderRadius: [6, 6, 0, 0] },
      data: item.values.map((value, index) => ({
        value,
        itemStyle: {
          color:
            typeof item.color === 'string' ? item.color : (item.color[index] ?? colors.primary),
        },
      })),
    })),
  };
  return <AppChart {...common} option={option} legend={<AppChartLegend items={legend} />} />;
}

/* ---------- Linha ---------- */

interface AppLineChartProps extends Common {
  readonly categories: readonly string[];
  readonly tooltipTitles: readonly string[];
  readonly name: string;
  readonly values: readonly number[];
  readonly formatValue: (value: number) => string;
  readonly formatAxis: (value: number) => string;
}

export function AppLineChart({
  categories,
  tooltipTitles,
  name,
  values,
  formatValue,
  formatAxis,
  ...common
}: AppLineChartProps) {
  const colors = useAppColors();
  const option = {
    grid: { top: 16, right: 16, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      ...tooltipBase(colors),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: colors.chartGrid } },
      formatter: (params: unknown) => {
        const index = (params as { dataIndex: number }[])[0]?.dataIndex ?? 0;
        return tooltipHtml(tooltipTitles[index] ?? '', [
          { color: colors.chartLine, label: name, value: formatValue(values[index] ?? 0) },
        ]);
      },
    },
    xAxis: { type: 'category', boundaryGap: false, data: [...categories], ...axisBase(colors) },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.textMuted, fontSize: 12, formatter: formatAxis },
      splitLine: { lineStyle: { color: colors.chartGrid } },
    },
    series: [
      {
        name,
        type: 'line',
        data: [...values],
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 7,
        showSymbol: values.length <= 24,
        lineStyle: { width: 3, color: colors.chartLine },
        itemStyle: { color: colors.chartLine, borderColor: colors.bgContainer, borderWidth: 2 },
        areaStyle: { color: colors.chartLine, opacity: 0.1 },
      },
    ],
  };
  return <AppChart {...common} option={option} />;
}

/* ---------- Rosca ---------- */

export interface DonutSlice {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

interface AppDonutChartProps extends Common {
  readonly slices: readonly DonutSlice[];
  readonly formatValue: (value: number) => string;
  readonly formatShare: (share: number) => string;
  readonly centerLabel?: string;
  readonly centerValue?: string;
}

export function AppDonutChart({
  slices,
  formatValue,
  formatShare,
  centerLabel,
  centerValue,
  ...common
}: AppDonutChartProps) {
  const colors = useAppColors();
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const option = {
    tooltip: {
      ...tooltipBase(colors),
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = params as { name: string; value: number; color: string };
        return tooltipHtml(item.name, [
          { color: item.color, label: 'Custo', value: formatValue(item.value) },
          {
            color: item.color,
            label: 'Participação',
            value: formatShare(total === 0 ? 0 : item.value / total),
          },
        ]);
      },
    },
    graphic: centerValue
      ? [
          {
            type: 'text',
            left: 'center',
            top: '42%',
            style: {
              text: centerValue,
              fill: colors.text,
              font: `700 18px ${FONT_MONO}`,
              textAlign: 'center',
            },
          },
          {
            type: 'text',
            left: 'center',
            top: '54%',
            style: {
              text: centerLabel ?? '',
              fill: colors.textMuted,
              font: '500 12px sans-serif',
              textAlign: 'center',
            },
          },
        ]
      : undefined,
    series: [
      {
        type: 'pie',
        radius: ['62%', '92%'],
        padAngle: 2,
        itemStyle: { borderRadius: 6, borderColor: colors.bgContainer, borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
        data: slices.map((slice) => ({
          name: slice.name,
          value: slice.value,
          itemStyle: { color: slice.color },
        })),
      },
    ],
  };
  return (
    <AppChart
      {...common}
      option={option}
      legend={
        <AppChartLegend
          items={slices.map((slice) => ({
            color: slice.color,
            label: `${slice.name} ${formatShare(total === 0 ? 0 : slice.value / total)}`,
          }))}
        />
      }
    />
  );
}
