import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppFlex } from './AppLayout';
import { AppStatus, AppTag } from './AppTag';

const meta = {
  title: 'Dados/AppTag e AppStatus',
  component: AppTag,
  args: { children: 'Day trade', tone: 'darf' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'gain', 'loss', 'darf', 'info', 'primary'] },
  },
} satisfies Meta<typeof AppTag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Etiqueta: Story = {};
export const Status: Story = {
  render: () => (
    <AppFlex gap="small" wrap>
      <AppStatus tone="success">Pago</AppStatus>
      <AppStatus tone="warning">Vence em breve</AppStatus>
      <AppStatus tone="danger">Vencido</AppStatus>
      <AppStatus tone="info">Pendente</AppStatus>
      <AppStatus tone="neutral">Encerrada</AppStatus>
    </AppFlex>
  ),
};
