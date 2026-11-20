import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppPagination } from './AppPagination';

const meta = {
  title: 'Navegação/AppPagination',
  component: AppPagination,
  args: {
    current: 1,
    total: 120,
    pageSize: 50,
    onChange: () => undefined,
    showTotal: (total: number, range: readonly [number, number]) =>
      `${range[0]}–${range[1]} de ${total} operações`,
  },
} satisfies Meta<typeof AppPagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Simples: Story = { args: { simple: true, showTotal: undefined } };
