import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';

const meta = {
  title: 'Sobreposições/AppModal',
  component: AppModal,
  args: {
    open: false,
    title: 'Nova operação',
    onClose: () => undefined,
    size: 'md',
    children: null,
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof AppModal>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo(args: React.ComponentProps<typeof AppModal>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppButton variant="primary" onClick={() => setOpen(true)}>
        Abrir diálogo
      </AppButton>
      <AppModal {...args} open={open} onClose={() => setOpen(false)}>
        Preencha os dados da operação e salve. Esc fecha e o foco volta para o botão.
      </AppModal>
    </>
  );
}

export const Padrao: Story = { render: (args) => <Demo {...args} /> };
export const Pequeno: Story = {
  args: { size: 'sm', title: 'Apagar tudo?' },
  render: (args) => <Demo {...args} />,
};
export const Aberto: Story = { args: { open: true, children: 'Conteúdo do diálogo.' } };
export const Carregando: Story = { args: { open: true, loading: true, children: 'Conteúdo' } };
