import { Component, type ErrorInfo, type ReactNode } from 'react';
import { serializeBackup } from '../domain/backupFile';
import { toPaidMarks } from '../domain/darf';
import { downloadText } from '../download';
import { markBackupDone } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { AppAlert, AppButton, AppFlex } from '../ui';

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|ChunkLoadError/i;

function RouteErrorFallback({ error }: { readonly error: Error }) {
  const { operations, paid } = useOperations();
  const isChunk = CHUNK_ERROR.test(error.message);
  return (
    <div style={{ maxWidth: 640, margin: '24px auto' }}>
      <AppAlert
        tone="error"
        role="alert"
        title={isChunk ? 'Não foi possível carregar esta tela' : 'Algo deu errado nesta tela'}
      >
        <AppFlex vertical gap="middle">
          <span>
            {isChunk
              ? 'Pode ser a conexão ou uma versão nova do app. Recarregue a página para tentar de novo.'
              : 'Seus dados continuam salvos neste navegador. Recarregue a página; se o erro voltar, exporte um backup.'}
          </span>
          <AppFlex gap="small" wrap>
            <AppButton variant="primary" onClick={() => window.location.reload()}>
              Recarregar
            </AppButton>
            <AppButton
              icon="download"
              onClick={() => {
                downloadText(
                  'backup-fiscotrack.json',
                  serializeBackup({ operations, paidDarfs: toPaidMarks(paid) }),
                  'application/json',
                );
                markBackupDone();
              }}
            >
              Exportar backup
            </AppButton>
          </AppFlex>
        </AppFlex>
      </AppAlert>
    </div>
  );
}

interface State {
  readonly error: Error | null;
}

/** Captura falhas de renderização e de carregamento de telas; evita a tela em branco. */
export class RouteErrorBoundary extends Component<{ readonly children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Sem serviço de telemetria (projeto 100% local): o detalhe fica só no console do navegador.
    // eslint-disable-next-line no-console
    console.error('Falha na tela', error, info.componentStack);
  }

  override render() {
    if (this.state.error !== null) return <RouteErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}
