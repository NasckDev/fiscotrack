import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppStack } from './AppLayout';
import { AppLink, AppParagraph, AppText, AppTitle } from './AppTypography';

const meta = {
  title: 'Base/AppTypography',
  component: AppText,
  args: { children: 'Texto de exemplo', mono: false, strong: false, size: 'md' },
  argTypes: {
    tone: { control: 'select', options: [undefined, 'gain', 'loss', 'darf', 'primary'] },
    type: { control: 'select', options: [undefined, 'secondary', 'success', 'warning', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof AppText>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};
export const Valor: Story = {
  args: { children: 'R$ 31.773,13', mono: true, strong: true, size: 'lg' },
};
export const Hierarquia: Story = {
  render: () => (
    <AppStack gap="small">
      <AppTitle level={1}>Título da página</AppTitle>
      <AppTitle level={2}>Título de seção</AppTitle>
      <AppTitle level={3}>Título de cartão</AppTitle>
      <AppParagraph type="secondary">Parágrafo de apoio com texto secundário.</AppParagraph>
      <AppLink to="/regras">Link interno</AppLink>
      <AppLink href="https://www.gov.br/receitafederal">Link externo</AppLink>
    </AppStack>
  ),
};
