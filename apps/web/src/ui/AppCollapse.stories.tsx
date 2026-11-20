import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppCollapse } from './AppCollapse';

const meta = {
  title: 'Dados/AppCollapse',
  component: AppCollapse,
  args: {
    ghost: false,
    items: [
      {
        key: 'why',
        label: 'Por que deu esse valor?',
        children: 'Imposto de 15% sobre o lucro, sem compensação.',
      },
      { key: 'rules', label: 'Regras aplicadas', children: 'br-rv-2024' },
    ],
  },
} satisfies Meta<typeof AppCollapse>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Aberto: Story = { args: { defaultActiveKey: ['why'] } };
export const Discreto: Story = { args: { ghost: true } };
