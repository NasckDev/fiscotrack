import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { toPaidMarks } from '../domain/darf';
import { describeStorageError } from '../domain/errors';
import { useOperations } from '../state/OperationsContext';
import { hasVisited, markVisited } from '../state/firstVisit';
import { EXAMPLE_ID_PREFIX, useExampleLoader } from '../state/useExampleLoader';
import { AppButton, useAppColors, useToasts } from '../ui';

// O diálogo de confirmação só carrega quando o usuário clica em "Começar com meus dados".
const AppConfirm = lazy(() =>
  import('../ui/AppConfirm').then((module) => ({ default: module.AppConfirm })),
);

/**
 * Na primeira visita com o banco vazio, carrega o exemplo sozinho (uma vez). Quem apagou os dados
 * de propósito não recebe o exemplo de novo.
 */
export function FirstVisitLoader() {
  const { status, operations } = useOperations();
  const { load } = useExampleLoader();
  const started = useRef(false);

  useEffect(() => {
    if (status !== 'ready' || started.current) return;
    started.current = true;
    if (hasVisited()) return;
    markVisited();
    if (operations.length > 0) return;
    // Sem aviso passageiro: o selo "Dados de exemplo" já diz o que está na tela.
    void load();
  }, [status, operations.length, load]);

  return null;
}

/** Selo "Dados de exemplo" com a saída para começar com os próprios dados. */
export function ExampleBanner() {
  const { operations, paid, clear, removeMany, merge } = useOperations();
  const toasts = useToasts();
  const colors = useAppColors();
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
      <section
        aria-label="Dados de exemplo"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 14px',
          padding: '8px 8px 8px 10px',
          borderRadius: 28,
          background: colors.bgContainer,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            background: colors.lime,
            color: colors.onLime,
            borderRadius: 999,
            padding: '5px 12px',
          }}
        >
          Dados de exemplo
        </span>
        <span style={{ flex: '1 1 240px', fontSize: 14, color: colors.textMuted }}>
          Operações fictícias para você explorar o app antes de lançar as suas.
        </span>
        <AppButton size="sm" onClick={() => setIsConfirming(true)}>
          Começar com meus dados
        </AppButton>
      </section>
      {isConfirming && (
        <Suspense fallback={null}>
          <AppConfirm
            open={isConfirming}
            title="Começar com seus dados?"
            message="As operações de exemplo serão removidas deste navegador. Você poderá desfazer logo em seguida."
            confirmLabel="Remover exemplo"
            onConfirm={() => void startFresh()}
            onCancel={() => setIsConfirming(false)}
          />
        </Suspense>
      )}
    </>
  );
}
