import type { ReactNode } from 'react';
import { useOperations } from '../state/OperationsContext';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { SkeletonBlock } from './ui';

function PageSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando operações salvas neste navegador…</span>
      <div className="space-y-4" aria-hidden="true">
        <SkeletonBlock className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonBlock className="col-span-2 h-40 lg:col-span-2" />
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-40" />
      </div>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-xl pt-6">
      <div role="alert" className="card flex flex-col items-center p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-surface text-danger">
          <Icon name="alert" size={24} />
        </span>
        <h1 className="mt-4 text-lg font-bold">Não foi possível ler os dados locais</h1>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <p className="mt-1 text-sm text-muted">
          Verifique se o navegador permite armazenamento neste site e tente de novo.
        </p>
        <button type="button" className="btn btn-primary mt-5" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
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
