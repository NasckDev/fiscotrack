import { Component, type ErrorInfo, type ReactNode } from 'react';
import { serializeBackup } from '../domain/backupFile';
import { toPaidMarks } from '../domain/darf';
import { downloadText } from '../download';
import { markBackupDone } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { Icon } from './Icon';

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|ChunkLoadError/i;

function RouteErrorFallback({ error }: { readonly error: Error }) {
  const { operations, paid } = useOperations();
  const isChunk = CHUNK_ERROR.test(error.message);
  return (
    <div className="mx-auto max-w-xl pt-6">
      <div role="alert" className="card flex flex-col items-center p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-surface text-danger">
          <Icon name="alert" size={24} />
        </span>
        <h1 className="mt-4 text-lg font-bold">
          {isChunk ? 'Não foi possível carregar esta tela' : 'Algo deu errado nesta tela'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isChunk
            ? 'Pode ser a conexão ou uma versão nova do app. Recarregue a página para tentar de novo.'
            : 'Seus dados continuam salvos neste navegador. Recarregue a página; se o erro voltar, exporte um backup.'}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              downloadText(
                'backup-fiscotrack.json',
                serializeBackup({ operations, paidDarfs: toPaidMarks(paid) }),
                'application/json',
              );
              markBackupDone();
            }}
          >
            <Icon name="download" size={16} />
            Exportar backup
          </button>
        </div>
      </div>
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
