import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSelect } from './AppSelect';

const options = [
  { value: 'all', label: 'Compra e venda' },
  { value: 'BUY', label: 'Só compras' },
  { value: 'SELL', label: 'Só vendas' },
];

const meta = {
  title: 'Formulário/AppSelect',
  component: AppSelect<string>,
  args: {
    options,
    'aria-label': 'Filtrar por tipo',
    placeholder: 'Escolha',
    disabled: false,
    loading: false,
    size: 'md',
  },
  argTypes: { status: { control: 'select', options: [undefined, 'error', 'warning'] } },
} satisfies Meta<typeof AppSelect<string>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { args: { defaultValue: 'all' } };
export const Vazio: Story = {};
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'BUY' } };
export const Carregando: Story = { args: { loading: true } };
export const Erro: Story = { args: { status: 'error' } };
