import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppUpload } from './AppUpload';

const meta = {
  title: 'Formulário/AppUpload',
  component: AppUpload,
  args: {
    title: 'Escolha o arquivo CSV da sua corretora',
    description: 'Arraste aqui ou clique para escolher',
    accept: '.csv,text/csv',
    disabled: false,
    onFile: () => undefined,
  },
} satisfies Meta<typeof AppUpload>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Desabilitado: Story = { args: { disabled: true } };
