import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppButton } from './AppButton';
import { AppDrawer } from './AppDrawer';

const meta = {
  title: 'Sobreposições/AppDrawer',
  component: AppDrawer,
  args: {
    open: false,
    title: 'Nova operação',
    onClose: () => undefined,
    placement: 'right',
    size: 'md',
    children: null,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['left', 'right', 'bottom'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof AppDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo(args: React.ComponentProps<typeof AppDrawer>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppButton variant="primary" onClick={() => setOpen(true)}>
        Abrir gaveta
      </AppButton>
      <AppDrawer {...args} open={open} onClose={() => setOpen(false)}>
        Conteúdo da gaveta.
      </AppDrawer>
    </>
  );
}

export const Direita: Story = { render: (args) => <Demo {...args} /> };
export const Inferior: Story = {
  args: { placement: 'bottom' },
  render: (args) => <Demo {...args} />,
};
export const Esquerda: Story = {
  args: { placement: 'left', size: 'sm', title: 'Menu' },
  render: (args) => <Demo {...args} />,
};
