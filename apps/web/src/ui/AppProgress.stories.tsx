import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppProgress } from './AppProgress';

const meta = {
  title: 'Dados/AppProgress',
  component: AppProgress,
  args: {
    percent: 57,
    label: 'Uso do limite mensal de isenção',
    valueText: '57% do limite usado',
    tone: 'gain',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['gain', 'darf', 'loss'] },
    percent: { control: { type: 'range', min: 0, max: 100 } },
  },
} satisfies Meta<typeof AppProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const LimiteUltrapassado: Story = {
  args: { percent: 100, tone: 'darf', valueText: 'Limite ultrapassado' },
};
export const Vazio: Story = { args: { percent: 0 } };
