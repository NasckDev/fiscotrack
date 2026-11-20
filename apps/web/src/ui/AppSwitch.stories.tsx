import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSwitch } from './AppSwitch';

const meta = {
  title: 'Formulário/AppSwitch',
  component: AppSwitch,
  args: { 'aria-label': 'Lembrar de fazer backup', disabled: false, loading: false },
} satisfies Meta<typeof AppSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Ligado: Story = { args: { defaultChecked: true } };
export const Desabilitado: Story = { args: { disabled: true } };
export const Carregando: Story = { args: { loading: true, defaultChecked: true } };
