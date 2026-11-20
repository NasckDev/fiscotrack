import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppMoney } from './AppMoney';

const meta = {
  title: 'Dados/AppMoney',
  component: AppMoney,
  args: { cents: 627_41, signed: false, strong: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof AppMoney>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Ganho: Story = { args: { cents: 418_276, signed: true } };
export const Perda: Story = { args: { cents: -72_913, signed: true } };
export const Zero: Story = { args: { cents: 0, signed: true } };
