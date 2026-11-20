import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppEmpty } from './AppEmpty';

const meta = {
  title: 'Feedback/AppEmpty',
  component: AppEmpty,
  args: {
    title: 'Nenhuma operação encontrada',
    description: 'Ajuste a busca ou os filtros para ver mais resultados.',
    icon: 'search',
  },
} satisfies Meta<typeof AppEmpty>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComAcao: Story = { args: { children: <AppButton>Limpar filtros</AppButton> } };
export const Ilustrado: Story = {
  args: {
    illustration: true,
    icon: undefined,
    title: 'Nenhuma operação ainda',
    children: <AppButton variant="primary">Carregar exemplo</AppButton>,
  },
};
