import { formatBRL } from '@fiscotrack/engine';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppStatistic } from './AppStatistic';

const meta = {
  title: 'Dados/AppStatistic',
  component: AppStatistic,
  args: {
    title: 'Patrimônio investido',
    icon: 'wallet',
    value: 3_177_313,
    format: formatBRL,
    hint: '3 ativos em carteira, ao custo',
    tone: 'default',
    loading: false,
    animated: false,
  },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'gain', 'loss', 'darf'] } },
} satisfies Meta<typeof AppStatistic>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Ganho: Story = {
  args: { title: 'Resultado em 2026', tone: 'gain', icon: 'trend-up' },
};
export const Perda: Story = {
  args: { title: 'Resultado em 2026', value: -72_913, tone: 'loss', icon: 'trend-down' },
};
export const Carregando: Story = { args: { loading: true } };
export const Animado: Story = { args: { animated: true } };
