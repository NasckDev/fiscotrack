import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppEmpty } from './AppEmpty';
import { AppMoney } from './AppMoney';
import { AppTable, type AppTableColumn } from './AppTable';

interface Row {
  readonly ticker: string;
  readonly quantity: number;
  readonly costCents: number;
}

const DATA: readonly Row[] = [
  { ticker: 'PETR4', quantity: 1000, costCents: 3_820_000 },
  { ticker: 'VALE3', quantity: 300, costCents: 1_950_000 },
  { ticker: 'ITUB4', quantity: 300, costCents: 1_083_000 },
];

const COLUMNS: readonly AppTableColumn<Row>[] = [
  {
    title: 'Ativo',
    key: 'ticker',
    dataIndex: 'ticker',
    sorter: (a, b) => a.ticker.localeCompare(b.ticker),
  },
  { title: 'Quantidade', key: 'quantity', dataIndex: 'quantity', align: 'right' },
  {
    title: 'Custo',
    key: 'cost',
    align: 'right',
    sorter: (a, b) => a.costCents - b.costCents,
    render: (_, row) => <AppMoney cents={row.costCents} />,
  },
];

const meta = {
  title: 'Dados/AppTable',
  component: AppTable<Row>,
  args: {
    columns: COLUMNS,
    data: DATA,
    rowKey: (row: Row) => row.ticker,
    ariaLabel: 'Posições da carteira',
    loading: false,
  },
} satisfies Meta<typeof AppTable<Row>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Carregando: Story = { args: { loading: true } };
export const Vazia: Story = {
  args: {
    data: [],
    empty: (
      <AppEmpty
        icon="search"
        title="Nenhuma posição"
        description="Lance uma compra para começar."
      />
    ),
  },
};
export const ComPaginacao: Story = {
  args: {
    data: Array.from({ length: 25 }, (_, index) => ({
      ticker: `ATV${index + 1}`,
      quantity: 100,
      costCents: 100_000,
    })),
    pageSize: 10,
    showTotal: (total, [from, to]) => `${from}–${to} de ${total} ativos`,
  },
};
