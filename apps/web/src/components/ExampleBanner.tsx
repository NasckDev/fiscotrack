import { useEffect, useRef, useState } from 'react';
import { toPaidMarks } from '../domain/darf';
import { describeStorageError } from '../domain/errors';
import { useOperations } from '../state/OperationsContext';
import { markVisited, hasVisited } from '../state/firstVisit';
import { EXAMPLE_ID_PREFIX, useExampleLoader } from '../state/useExampleLoader';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { useToasts } from './Toasts';

/**
 * Na primeira visita com o banco vazio, carrega o exemplo sozinho (uma vez). Quem apagou os dados
 * de propósito não recebe o exemplo de novo.
 */
export function FirstVisitLoader() {
  const { status, operations } = useOperations();
  const { load } = useExampleLoader();
  const toasts = useToasts();
  const started = useRef(false);

  useEffect(() => {
    if (status !== 'ready' || started.current) return;
    started.current = true;
    if (hasVisited()) return;
    markVisited();
    if (operations.length > 0) return;
    void load().then((ok) => {
      if (ok) toasts.show('Exemplo carregado para você explorar. Todos os dados são fictícios.');
    });
  }, [status, operations.length, load, toasts]);

  return null;
}

/** Selo fixo "Dados de exemplo" com a saída para começar com os próprios dados. */
export function ExampleBanner() {
  const { operations, paid, clear, removeMany, merge } = useOperations();
  const toasts = useToasts();
  const [isConfirming, setIsConfirming] = useState(false);
  const examples = operations.filter((operation) => operation.id.startsWith(EXAMPLE_ID_PREFIX));
  if (examples.length === 0) return null;

  const startFresh = async () => {
    setIsConfirming(false);
    const snapshot = { operations, paid: toPaidMarks(paid) };
    try {
      if (examples.length === operations.length) await clear();
      else await removeMany(examples.map((operation) => operation.id));
      markVisited();
      toasts.show('Dados de exemplo removidos. Comece lançando ou importando as suas operações.', {
        action: { label: 'Desfazer', run: () => void merge(snapshot.operations, snapshot.paid) },
      });
    } catch (error: unknown) {
      toasts.show(describeStorageError(error, 'Não foi possível remover o exemplo.'), {
        tone: 'danger',
      });
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label="Dados de exemplo"
        className="flex items-center gap-x-3 border-b border-line-soft bg-warning-surface px-4 py-0.5 text-xs text-ink sm:px-6 lg:px-10"
      >
        <span className="flex items-center gap-1.5 font-bold">
          <Icon name="sparkles" size={14} />
          Dados de exemplo
        </span>
        <span className="hidden text-muted sm:inline">fictícios, só para você explorar</span>
        <button
          type="button"
          className="-my-1 ml-auto inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-2"
          onClick={() => setIsConfirming(true)}
        >
          Começar com meus dados
        </button>
      </div>
      <ConfirmDialog
        open={isConfirming}
        title="Começar com seus dados?"
        message="As operações de exemplo serão removidas deste navegador. Você poderá desfazer logo em seguida."
        confirmLabel="Remover exemplo"
        onConfirm={() => void startFresh()}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
