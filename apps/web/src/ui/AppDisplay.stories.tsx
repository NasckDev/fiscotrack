import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppFlex } from './AppLayout';
import { AppDescriptions, AppResult, AppSegmented } from './AppExtras';
import { AppAvatar, AppBadge, AppPopover, AppTooltip } from './AppMisc';
import { useState } from 'react';

const meta = {
  title:
    'Dados/AppAvatar, AppBadge, AppTooltip, AppPopover, AppSegmented, AppResult e AppDescriptions',
  component: AppAvatar,
  args: { initials: 'VC', label: 'Você', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof AppAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Avatar: Story = {};
export const Selo: Story = {
  render: () => (
    <AppBadge count={3}>
      <AppButton icon="bell" aria-label="Avisos" />
    </AppBadge>
  ),
};
export const DicaDeFerramenta: Story = {
  render: () => (
    <AppTooltip title="Marca o DARF como pago">
      <AppButton>Marcar como pago</AppButton>
    </AppTooltip>
  ),
};
export const Balao: Story = {
  render: () => (
    <AppPopover title="Avisos" content="Nenhum aviso. Seus DARFs estão em dia.">
      <AppButton>Abrir avisos</AppButton>
    </AppPopover>
  ),
};
function SegmentedDemo() {
  const [value, setValue] = useState<'light' | 'dark'>('light');
  return (
    <AppSegmented
      aria-label="Tema"
      value={value}
      onChange={setValue}
      options={[
        { value: 'light', label: 'Claro', icon: 'sun' },
        { value: 'dark', label: 'Escuro', icon: 'moon' },
      ]}
    />
  );
}
export const Segmentado: Story = { render: () => <SegmentedDemo /> };
export const Resultado: Story = {
  render: () => (
    <AppResult
      status="success"
      title="2 operações importadas"
      description="Todas as linhas válidas foram importadas."
      actions={
        <AppFlex gap="small" justify="center">
          <AppButton variant="primary">Ver o início</AppButton>
        </AppFlex>
      }
    />
  ),
};
export const Descricoes: Story = {
  render: () => (
    <AppDescriptions
      items={[
        { label: 'Alíquota comum', value: '15%' },
        { label: 'Alíquota day trade', value: '20%' },
        { label: 'Isenção mensal', value: 'R$ 20.000,00' },
        { label: 'DARF mínimo', value: 'R$ 10,00' },
      ]}
    />
  ),
};
