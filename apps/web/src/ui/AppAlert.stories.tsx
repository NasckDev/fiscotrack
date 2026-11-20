import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppAlert } from './AppAlert';
import { AppButton } from './AppButton';

const meta = {
  title: 'Feedback/AppAlert',
  component: AppAlert,
  args: {
    tone: 'warning',
    title: 'Resultado parcial: 1 operação ignorada',
    children: 'Lance a compra que falta em Operações para completar o cálculo.',
    closable: false,
  },
  argTypes: { tone: { control: 'inline-radio', options: ['success', 'info', 'warning', 'error'] } },
} satisfies Meta<typeof AppAlert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Aviso: Story = {};
export const Erro: Story = {
  args: {
    tone: 'error',
    title: 'Não foi possível importar',
    children: 'O arquivo está vazio. Escolha um CSV com cabeçalho.',
  },
};
export const Sucesso: Story = {
  args: { tone: 'success', title: '2 operações importadas', children: undefined },
};
export const Informativo: Story = { args: { tone: 'info', closable: true, children: undefined } };
export const ComAcao: Story = { args: { action: <AppButton size="sm">Fazer backup</AppButton> } };
