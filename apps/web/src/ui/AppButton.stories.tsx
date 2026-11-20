import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppFlex } from './AppLayout';

const meta = {
  title: 'Ações/AppButton',
  component: AppButton,
  args: {
    children: 'Marcar como pago',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    danger: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'link', 'dashed'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: 'select', options: [undefined, 'check', 'plus', 'download', 'trash'] },
  },
} satisfies Meta<typeof AppButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { args: { icon: 'check' } };
export const Desabilitado: Story = { args: { disabled: true } };
export const Carregando: Story = { args: { loading: true, children: 'Salvando…' } };
export const Perigo: Story = {
  args: { danger: true, variant: 'primary', icon: 'trash', children: 'Apagar tudo' },
};
export const Variantes: Story = {
  render: (args) => (
    <AppFlex gap="middle" wrap>
      {(['primary', 'secondary', 'ghost', 'link', 'dashed'] as const).map((variant) => (
        <AppButton key={variant} {...args} variant={variant}>
          {variant}
        </AppButton>
      ))}
    </AppFlex>
  ),
};
