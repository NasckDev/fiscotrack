import type { ReactNode } from 'react';
import { useOperations } from '../state/OperationsContext';
import { AppButton, AppCard, AppResult, AppRow, AppCol, AppSkeleton } from '../ui';
import { EmptyState } from './EmptyState';

function PageSkeleton() {
  return (
    <div>
      <AppSkeleton variant="text" rows={1} label="Carregando operações salvas neste navegador…" />
      <AppRow>
        <AppCol xs={24} xl={12}>
          <AppCard fullHeight>
            <AppSkeleton variant="text" rows={3} label="Carregando próximo DARF" />
          </AppCard>
        </AppCol>
        <AppCol xs={12} xl={6}>
          <AppCard fullHeight>
            <AppSkeleton variant="text" rows={2} label="Carregando patrimônio" />
          </AppCard>
        </AppCol>
        <AppCol xs={12} xl={6}>
          <AppCard fullHeight>
            <AppSkeleton variant="text" rows={2} label="Carregando resultado" />
          </AppCard>
        </AppCol>
      </AppRow>
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  readonly message: string | null;
  readonly onRetry: () => void;
}) {
  return (
    <div role="alert">
      <AppCard>
        <AppResult
          status="error"
          title="Não foi possível ler os dados locais"
          description={`${message ?? ''} Verifique se o navegador permite armazenamento neste site e tente de novo.`.trim()}
          actions={
            <AppButton variant="primary" onClick={onRetry}>
              Tentar novamente
            </AppButton>
          }
        />
      </AppCard>
    </div>
  );
}

interface DataGateProps {
  readonly children: ReactNode;
  /** Mostra o conteúdo mesmo sem operações (Operações, Importar, Configurações). */
  readonly allowEmpty?: boolean;
}

/** Resolve carregando, erro e vazio de forma única para todas as telas que dependem dos dados. */
export function DataGate({ children, allowEmpty = false }: DataGateProps) {
  const { status, operations, errorMessage, reload } = useOperations();
  if (status === 'loading') return <PageSkeleton />;
  if (status === 'error') return <ErrorView message={errorMessage} onRetry={() => void reload()} />;
  if (operations.length === 0 && !allowEmpty) return <EmptyState />;
  return <>{children}</>;
}
