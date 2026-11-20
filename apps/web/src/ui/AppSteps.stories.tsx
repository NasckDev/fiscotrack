import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSteps } from './AppSteps';

const items = [
  { title: 'Escolher o arquivo', description: 'CSV da corretora' },
  { title: 'Conferir e importar', description: 'Colunas, prévia e erros' },
  { title: 'Concluído', description: 'Operações salvas' },
];

const meta = {
  title: 'Feedback/AppSteps',
  component: AppSteps,
  args: { items, current: 1, size: 'md', vertical: false },
  argTypes: { current: { control: { type: 'number', min: 0, max: 2 } } },
} satisfies Meta<typeof AppSteps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Vertical: Story = { args: { vertical: true } };
export const ComErro: Story = {
  args: { items: [items[0]!, { ...items[1]!, status: 'error' }, items[2]!], current: 1 },
};
