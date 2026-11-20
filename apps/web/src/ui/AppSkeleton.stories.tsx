import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSkeleton } from './AppSkeleton';

const meta = {
  title: 'Feedback/AppSkeleton',
  component: AppSkeleton,
  args: { variant: 'text', rows: 3, active: true, label: 'Carregando operações…' },
  argTypes: { variant: { control: 'inline-radio', options: ['text', 'block', 'table'] } },
} satisfies Meta<typeof AppSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};
export const Bloco: Story = { args: { variant: 'block' } };
export const Tabela: Story = { args: { variant: 'table', rows: 5 } };
export const Parado: Story = { args: { active: false } };
