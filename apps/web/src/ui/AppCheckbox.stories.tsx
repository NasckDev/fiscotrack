import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppCheckbox } from './AppCheckbox';

const meta = {
  title: 'Formulário/AppCheckbox',
  component: AppCheckbox,
  args: { children: 'Ignorar as possíveis repetidas', disabled: false, indeterminate: false },
} satisfies Meta<typeof AppCheckbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Marcado: Story = { args: { defaultChecked: true } };
export const Desabilitado: Story = { args: { disabled: true } };
