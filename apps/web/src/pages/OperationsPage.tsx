import { formatBRL, type Operation } from '@fiscotrack/engine';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { DataGate } from '../components/DataGate';
import { OperationDialog } from '../components/OperationDialog';
import { PageHeader } from '../components/PageHeader';
import { operationsToCsv } from '../domain/csvExport';
import { toPaidMarks } from '../domain/darf';
import { formatDate, formatDateShort, plural } from '../domain/format';
import { downloadText } from '../download';
import { useOperations } from '../state/OperationsContext';
import { useRunner } from '../state/useRunner';
import {
  AppButton,
  AppCard,
  AppConfirm,
  AppEmpty,
  AppFlex,
  AppIconButton,
  AppLink,
  AppSearchInput,
  AppSelect,
  AppStack,
  AppTable,
  AppTag,
  AppText,
  useToasts,
  type AppTableColumn,
} from '../ui';

const PAGE_SIZE = 50;

interface Filters {
  readonly query: string;
  readonly side: 'all' | 'BUY' | 'SELL';
  readonly category: 'all' | 'SWING' | 'DAY_TRADE';
}

const NO_FILTERS: Filters = { query: '', side: 'all', category: 'all' };

const SIDE_OPTIONS = [
  { value: 'all', label: 'Compra e venda' },
  { value: 'BUY', label: 'Só compras' },
  { value: 'SELL', label: 'Só vendas' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas as modalidades' },
  { value: 'SWING', label: 'Comum' },
  { value: 'DAY_TRADE', label: 'Day trade' },
] as const;

function applyFilters(operations: readonly Operation[], filters: Filters): readonly Operation[] {
  const query = filters.query.trim().toUpperCase();
  return operations
    .filter((operation) => query === '' || operation.ticker.includes(query))
    .filter((operation) => filters.side === 'all' || operation.side === filters.side)
    .filter((operation) => filters.category === 'all' || operation.category === filters.category)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.seq ?? 0) - (a.seq ?? 0) || b.id.localeCompare(a.id),
    );
}

function SideTags({ operation }: { readonly operation: Operation }) {
  const isBuy = operation.side === 'BUY';
  return (
    <AppFlex gap="small" wrap>
      <AppTag tone={isBuy ? 'info' : 'gain'}>{isBuy ? 'Compra' : 'Venda'}</AppTag>
      {operation.category === 'DAY_TRADE' && <AppTag tone="darf">Day trade</AppTag>}
    </AppFlex>
  );
}

interface RowActionsProps {
  readonly operation: Operation;
  readonly onEdit: (operation: Operation) => void;
  readonly onDelete: (operation: Operation) => void;
}

function RowActions({ operation, onEdit, onDelete }: RowActionsProps) {
  const label = `${operation.ticker} em ${formatDate(operation.date)}`;
  return (
    <AppFlex gap="small">
      <AppIconButton
        icon="pencil"
        label={`Editar operação de ${label}`}
        onClick={() => onEdit(operation)}
      />
      <AppIconButton
        icon="trash"
        danger
        label={`Excluir operação de ${label}`}
        onClick={() => onDelete(operation)}
      />
    </AppFlex>
  );
}

function buildColumns(
  actions: Omit<RowActionsProps, 'operation'>,
): readonly AppTableColumn<Operation>[] {
  return [
    {
      title: 'Data',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (_, operation) => (
        <AppText mono size="sm">
          {formatDate(operation.date)}
        </AppText>
      ),
    },
    {
      title: 'Ativo',
      key: 'ticker',
      sorter: (a, b) => a.ticker.localeCompare(b.ticker),
      render: (_, operation) => (
        <AppLink to={`/carteira/${operation.ticker}`}>
          <strong>{operation.ticker}</strong>
        </AppLink>
      ),
    },
    { title: 'Tipo', key: 'side', render: (_, operation) => <SideTags operation={operation} /> },
    {
      title: 'Qtd.',
      key: 'qty',
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (_, operation) => <AppText mono>{operation.quantity}</AppText>,
    },
    {
      title: 'Preço',
      key: 'price',
      align: 'right',
      sorter: (a, b) => a.unitPriceCents - b.unitPriceCents,
      render: (_, operation) => <AppText mono>{formatBRL(operation.unitPriceCents)}</AppText>,
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      sorter: (a, b) => a.quantity * a.unitPriceCents - b.quantity * b.unitPriceCents,
      render: (_, operation) => (
        <AppText mono strong>
          {formatBRL(operation.quantity * operation.unitPriceCents)}
        </AppText>
      ),
    },
    {
      title: 'Custos',
      key: 'fees',
      align: 'right',
      render: (_, operation) => (
        <AppText mono type="secondary">
          {formatBRL(operation.feesCents)}
        </AppText>
      ),
    },
    {
      title: <span className="sr-only">Ações</span>,
      key: 'actions',
      align: 'right',
      render: (_, operation) => <RowActions operation={operation} {...actions} />,
    },
  ];
}

function OperationCard({ operation, ...actions }: RowActionsProps) {
  return (
    <AppFlex align="center" justify="space-between" gap="small">
      <div style={{ minWidth: 0 }}>
        <AppFlex align="center" gap="small" wrap>
          <AppText strong>{operation.ticker}</AppText>
          <SideTags operation={operation} />
        </AppFlex>
        <AppText type="secondary" mono size="sm" block>
          {formatDateShort(operation.date)}
          <br />
          {operation.quantity} × {formatBRL(operation.unitPriceCents)}
        </AppText>
      </div>
      <RowActions operation={operation} {...actions} />
    </AppFlex>
  );
}

function Toolbar({
  filters,
  onChange,
}: {
  readonly filters: Filters;
  readonly onChange: (next: Filters) => void;
}) {
  return (
    <AppFlex gap="small" wrap>
      <div style={{ flex: '2 1 240px' }}>
        <AppSearchInput
          aria-label="Buscar por ativo"
          placeholder="Buscar ativo (ex.: PETR4)"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
      <div style={{ flex: '1 1 170px' }}>
        <AppSelect
          aria-label="Filtrar por tipo"
          options={SIDE_OPTIONS}
          value={filters.side}
          onChange={(side) => onChange({ ...filters, side })}
        />
      </div>
      <div style={{ flex: '1 1 200px' }}>
        <AppSelect
          aria-label="Filtrar por modalidade"
          options={CATEGORY_OPTIONS}
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category })}
        />
      </div>
    </AppFlex>
  );
}

function OperationsContent() {
  const { operations, paid, addMany, remove, clear, merge } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const isDialogOpen = params.get('nova') === '1' || editing !== null;
  const defaultTicker = params.get('ticker')?.toUpperCase() ?? undefined;
  const visible = applyFilters(operations, filters);

  const closeDialog = () => {
    setEditing(null);
    if (params.has('nova')) setParams({}, { replace: true });
  };

  const save = async (operation: Operation, isEdit: boolean): Promise<string | null> => {
    const ok = await run(() => addMany([operation]), 'Não foi possível salvar a operação.');
    if (!ok) return 'Não foi possível salvar. Tente de novo ou exporte um backup antes.';
    closeDialog();
    toasts.show(isEdit ? 'Operação atualizada.' : 'Operação adicionada.');
    return null;
  };

  const handleDelete = async (operation: Operation) => {
    if (!(await run(() => remove(operation.id), 'Não foi possível excluir a operação.'))) return;
    toasts.show(`Operação de ${operation.ticker} excluída.`, {
      action: {
        label: 'Desfazer',
        run: () => void run(() => addMany([operation]), 'Não foi possível desfazer a exclusão.'),
      },
    });
  };

  const handleClear = async () => {
    const snapshot = { operations, paid: toPaidMarks(paid) };
    setIsClearing(false);
    if (!(await run(clear, 'Não foi possível apagar as operações.'))) return;
    toasts.show('Todas as operações foram apagadas.', {
      action: {
        label: 'Desfazer',
        run: () =>
          void run(() => merge(snapshot.operations, snapshot.paid), 'Não foi possível desfazer.'),
      },
    });
  };

  const rowActions = {
    onEdit: setEditing,
    onDelete: (operation: Operation) => void handleDelete(operation),
  };

  return (
    <AppStack>
      <PageHeader
        title="Operações"
        trail={[]}
        description={`${plural(operations.length, 'operação salva', 'operações salvas')} neste navegador`}
        actions={
          <AppFlex gap="small" wrap>
            <AppButton icon="upload" to="/importar">
              Importar CSV
            </AppButton>
            <AppButton variant="primary" icon="plus" onClick={() => setParams({ nova: '1' })}>
              Nova operação
            </AppButton>
          </AppFlex>
        }
      />
      <section aria-label="Lista de operações">
        <AppCard>
          <AppStack>
            <Toolbar filters={filters} onChange={setFilters} />
            <AppTable
              key={`${filters.query}|${filters.side}|${filters.category}`}
              ariaLabel="Operações salvas neste navegador"
              columns={buildColumns(rowActions)}
              data={visible}
              rowKey={(operation) => operation.id}
              pageSize={PAGE_SIZE}
              showTotal={(total, [from, to]) =>
                `${from}–${to} de ${plural(total, 'operação', 'operações')}`
              }
              cardsBelow={1024}
              renderCard={(operation) => <OperationCard operation={operation} {...rowActions} />}
              empty={
                <AppEmpty
                  icon="search"
                  title="Nenhuma operação encontrada"
                  description={
                    operations.length === 0
                      ? 'Adicione uma operação ou importe um CSV para começar.'
                      : 'Ajuste a busca ou os filtros para ver mais resultados.'
                  }
                >
                  {operations.length > 0 && (
                    <AppButton onClick={() => setFilters(NO_FILTERS)}>Limpar filtros</AppButton>
                  )}
                </AppEmpty>
              }
            />
            <AppFlex justify="flex-end" gap="small" wrap>
              <AppButton
                icon="download"
                disabled={visible.length === 0}
                onClick={() =>
                  downloadText('operacoes-fiscotrack.csv', operationsToCsv(visible), 'text/csv')
                }
              >
                Exportar CSV
              </AppButton>
              <AppButton
                danger
                icon="trash"
                disabled={operations.length === 0}
                onClick={() => setIsClearing(true)}
              >
                Apagar todas
              </AppButton>
            </AppFlex>
          </AppStack>
        </AppCard>
      </section>
      <OperationDialog
        open={isDialogOpen}
        editing={editing}
        defaultTicker={defaultTicker}
        onClose={closeDialog}
        onSave={save}
      />
      <AppConfirm
        open={isClearing}
        title="Apagar todas as operações?"
        message={`As ${plural(operations.length, 'operação', 'operações')} e os DARFs marcados como pagos serão removidos deste navegador. Você pode desfazer logo em seguida, mas só um backup garante a recuperação depois.`}
        confirmLabel="Apagar tudo"
        onConfirm={() => void handleClear()}
        onCancel={() => setIsClearing(false)}
      />
    </AppStack>
  );
}

export function OperationsPage() {
  return (
    <DataGate allowEmpty>
      <OperationsContent />
    </DataGate>
  );
}
