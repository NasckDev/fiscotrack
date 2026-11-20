import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppIconButton } from './AppIconButton';

const meta = {
  title: 'Ações/AppIconButton',
  component: AppIconButton,
  args: { icon: 'pencil', label: 'Editar operação', disabled: false, danger: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof AppIconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Desabilitado: Story = { args: { disabled: true } };
export const Perigo: Story = { args: { icon: 'trash', danger: true, label: 'Excluir operação' } };
