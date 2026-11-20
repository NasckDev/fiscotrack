import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppList } from './AppList';
import { AppMoney } from './AppMoney';

interface Item {
  readonly id: string;
  readonly label: string;
  readonly cents: number;
}

const meta = {
  title: 'Dados/AppList',
  component: AppList<Item>,
  args: {
    'aria-label': 'Posições',
    items: [
      { id: '1', label: 'PETR4', cents: 3_820_000 },
      { id: '2', label: 'VALE3', cents: 1_950_000 },
    ],
    itemKey: (item: Item) => item.id,
    renderItem: (item: Item) => (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{item.label}</strong>
        <AppMoney cents={item.cents} />
      </div>
    ),
  },
} satisfies Meta<typeof AppList<Item>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Vazia: Story = { args: { items: [] } };
