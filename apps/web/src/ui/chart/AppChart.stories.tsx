import { formatBRL } from '@fiscotrack/engine';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAppColors } from '../theme/AppThemeProvider';
import { AppBarChart, AppDonutChart, AppLineChart } from './charts';

const MONTHS = ['jun/26', 'jul/26', 'ago/26', 'set/26', 'out/26'];
const RESULTS = [0, 1428.14, -729.13, 6337.56, 4182.76];
const money = (value: number) => formatBRL(Math.round(value * 100));
const axis = (value: number) => `R$ ${(value / 1000).toLocaleString('pt-BR')} mil`;

const meta = {
  title: 'Gráficos/AppChart (ECharts)',
  component: AppBarChart,
  args: {
    title: 'Resultado por mês',
    description: 'Barras de resultado por mês, de jun/26 a out/26.',
    categories: MONTHS,
    tooltipTitles: MONTHS,
    series: [],
    legend: [],
    formatValue: money,
    formatAxis: axis,
    table: {
      head: ['Mês', 'Resultado'],
      rows: MONTHS.map((month, index) => [month, money(RESULTS[index] ?? 0)]),
    },
  },
} satisfies Meta<typeof AppBarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

function BarsDemo(args: React.ComponentProps<typeof AppBarChart>) {
  const colors = useAppColors();
  return (
    <AppBarChart
      {...args}
      series={[
        {
          name: 'Resultado',
          values: RESULTS,
          color: RESULTS.map((v) => (v < 0 ? colors.lossFill : colors.gainFill)),
        },
      ]}
      legend={[
        { color: colors.gainFill, label: 'Lucro' },
        { color: colors.lossFill, label: 'Prejuízo' },
      ]}
    />
  );
}
export const Barras: Story = { render: (args) => <BarsDemo {...args} /> };

export const Linha: Story = {
  render: (args) => (
    <AppLineChart
      title="Resultado acumulado"
      description="Linha do resultado acumulado, de jun/26 a out/26."
      categories={MONTHS}
      tooltipTitles={MONTHS}
      name="Acumulado"
      values={[0, 1428.14, 699.01, 7036.57, 11219.33]}
      formatValue={money}
      formatAxis={axis}
      table={args.table}
    />
  ),
};

function DonutDemo(args: React.ComponentProps<typeof AppBarChart>) {
  const colors = useAppColors();
  return (
    <AppDonutChart
      title="Alocação por ativo"
      description="Rosca com a distribuição do patrimônio por ativo."
      slices={[
        { name: 'VALE3', value: 18300, color: colors.categorical[0] ?? '' },
        { name: 'MGLU3', value: 7840, color: colors.categorical[1] ?? '' },
        { name: 'BBAS3', value: 5620, color: colors.categorical[2] ?? '' },
      ]}
      formatValue={money}
      formatShare={(share) => `${(share * 100).toFixed(1)}%`}
      centerValue="R$ 31,8 mil"
      centerLabel="ao custo"
      table={args.table}
    />
  );
}
export const Rosca: Story = { render: (args) => <DonutDemo {...args} /> };
