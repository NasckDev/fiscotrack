import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppDatePicker } from './AppDatePicker';

const meta = {
  title: 'Formulário/AppDatePicker',
  component: AppDatePicker,
  args: { 'aria-label': 'Data da operação', max: '2026-12-31', disabled: false },
  argTypes: { status: { control: 'select', options: [undefined, 'error', 'warning'] } },
} satisfies Meta<typeof AppDatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { args: { value: '2026-03-15' } };
export const Vazio: Story = { args: { placeholder: 'DD/MM/AAAA' } };
export const Desabilitado: Story = { args: { value: '2026-03-15', disabled: true } };
export const Erro: Story = { args: { status: 'error' } };
