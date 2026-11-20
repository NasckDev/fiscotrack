import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppFlex } from './AppLayout';
import { useToasts } from './AppToast';

function ToastDemo() {
  const toasts = useToasts();
  return (
    <AppFlex gap="small" wrap>
      <AppButton onClick={() => toasts.show('Operação adicionada.')}>Sucesso</AppButton>
      <AppButton
        onClick={() =>
          toasts.show('Operação de PETR4 excluída.', {
            action: { label: 'Desfazer', run: () => undefined },
          })
        }
      >
        Com desfazer
      </AppButton>
      <AppButton
        danger
        onClick={() => toasts.show('Armazenamento cheio. Exporte um backup.', { tone: 'danger' })}
      >
        Erro
      </AppButton>
    </AppFlex>
  );
}

const meta = { title: 'Feedback/AppToast', component: ToastDemo } satisfies Meta<typeof ToastDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
