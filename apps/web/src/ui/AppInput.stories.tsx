import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppInput, AppSearchInput } from './AppInput';

const meta = {
  title: 'Formulário/AppInput',
  component: AppInput,
  args: { placeholder: 'PETR4', disabled: false, mono: false, size: 'md', 'aria-label': 'Ativo' },
  argTypes: {
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof AppInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'VALE3' } };
export const Erro: Story = { args: { status: 'error', defaultValue: 'XX' } };
export const ValorMono: Story = {
  args: { mono: true, defaultValue: '1.234,56', inputMode: 'decimal' },
};
export const Busca: Story = {
  render: () => (
    <AppSearchInput aria-label="Buscar ativo" placeholder="Buscar ativo (ex.: PETR4)" />
  ),
};
