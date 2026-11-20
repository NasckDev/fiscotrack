import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppConfirm } from './AppConfirm';

const meta = {
  title: 'Sobreposições/AppConfirm',
  component: AppConfirm,
  args: {
    open: true,
    title: 'Apagar todas as operações?',
    message: 'As operações serão removidas deste navegador. Você pode desfazer logo em seguida.',
    confirmLabel: 'Apagar tudo',
    danger: true,
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof AppConfirm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Perigosa: Story = {};
export const Neutra: Story = {
  args: { danger: false, title: 'Restaurar este backup?', confirmLabel: 'Substituir dados' },
};
