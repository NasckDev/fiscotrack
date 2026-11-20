import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppCard } from './AppCard';
import { AppCol, AppFlex, AppRow, AppStack } from './AppLayout';

const meta = {
  title: 'Base/AppLayout (Flex, Stack, Row, Col)',
  component: AppFlex,
  args: { gap: 'middle', wrap: true, children: null },
  argTypes: { gap: { control: 'inline-radio', options: ['small', 'middle', 'large'] } },
} satisfies Meta<typeof AppFlex>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Linha: Story = {
  render: (args) => (
    <AppFlex {...args}>
      <AppCard>Um</AppCard>
      <AppCard>Dois</AppCard>
      <AppCard>Três</AppCard>
    </AppFlex>
  ),
};
export const Pilha: Story = {
  render: () => (
    <AppStack>
      <AppCard>Primeiro bloco</AppCard>
      <AppCard>Segundo bloco</AppCard>
    </AppStack>
  ),
};
export const Grade: Story = {
  render: () => (
    <AppRow>
      <AppCol xs={24} md={12} xl={8}>
        <AppCard fullHeight>Coluna A</AppCard>
      </AppCol>
      <AppCol xs={24} md={12} xl={8}>
        <AppCard fullHeight>Coluna B</AppCard>
      </AppCol>
      <AppCol xs={24} md={24} xl={8}>
        <AppCard fullHeight>Coluna C</AppCard>
      </AppCol>
    </AppRow>
  ),
};
