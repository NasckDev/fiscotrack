import { useExampleLoader } from '../state/useExampleLoader';
import { AppButton, AppCard, AppEmpty, AppFlex, AppText, useToasts } from '../ui';

/** Primeira visita ou sem dados: o exemplo carrega com um clique. */
export function EmptyState() {
  const { load, isWorking, hasFailed } = useExampleLoader();
  const toasts = useToasts();

  const handleLoad = async () => {
    if (await load()) toasts.show('Exemplo carregado. Todos os dados são fictícios.');
  };

  return (
    <section style={{ maxWidth: 640, margin: '24px auto' }}>
      <AppCard padding="lg">
        <AppEmpty
          illustration
          titleAs="h1"
          title="Nenhuma operação ainda"
          description="Veja o FiscoTrack funcionando com operações de exemplo (dados fictícios) ou traga as suas: importe um CSV da corretora ou lance uma operação. Tudo fica só neste navegador."
        >
          <AppFlex gap="small" justify="center" wrap>
            <AppButton
              variant="primary"
              icon="sparkles"
              loading={isWorking}
              onClick={() => void handleLoad()}
            >
              {isWorking ? 'Carregando…' : 'Carregar exemplo'}
            </AppButton>
            <AppButton icon="upload" to="/importar">
              Importar CSV
            </AppButton>
            <AppButton variant="ghost" to="/operacoes?nova=1">
              Lançar operação
            </AppButton>
          </AppFlex>
          {hasFailed && (
            <div role="alert" style={{ marginTop: 16 }}>
              <AppText type="danger">Não foi possível carregar o exemplo. Tente de novo.</AppText>
            </div>
          )}
        </AppEmpty>
      </AppCard>
    </section>
  );
}
