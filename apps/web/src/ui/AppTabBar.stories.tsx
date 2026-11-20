import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppTabBar } from './AppTabBar';

const meta = {
  title: 'Navegação/AppTabBar',
  component: AppTabBar,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: {
    'aria-label': 'Principal',
    items: [
      { to: '/', label: 'Início', icon: 'home' },
      { to: '/carteira', label: 'Carteira', icon: 'wallet' },
      { to: '/operacoes', label: 'Operações', icon: 'operations' },
      { to: '/darfs', label: 'DARFs', icon: 'receipt' },
    ],
  },
} satisfies Meta<typeof AppTabBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
