import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

const meta = {
  title: 'Dados/AppCard',
  component: AppCard,
  args: {
    title: 'Resumo do mês',
    loading: false,
    tone: 'default',
    padding: 'md',
    children: 'Conteúdo do cartão.',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['default', 'subtle', 'hero'] },
    padding: { control: 'inline-radio', options: ['none', 'md', 'lg'] },
  },
} satisfies Meta<typeof AppCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { args: { extra: <AppButton variant="link">Ver mais</AppButton> } };
export const Destaque: Story = {
  args: { tone: 'hero', title: undefined, children: 'Próximo DARF' },
};
export const Sutil: Story = { args: { tone: 'subtle' } };
export const Carregando: Story = { args: { loading: true } };
