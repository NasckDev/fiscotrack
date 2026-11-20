import { formatBRL, type Operation } from '@fiscotrack/engine';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { OperationDialog } from '../components/OperationDialog';
import { Reveal } from '../components/Reveal';
import { useToasts } from '../components/Toasts';
import { PageHeader } from '../components/ui';
import { operationsToCsv } from '../domain/csvExport';
import { toPaidMarks } from '../domain/darf';
import { formatDate, formatDateShort, plural } from '../domain/format';
import { downloadText } from '../download';
import { useOperations } from '../state/OperationsContext';
import { useRunner } from '../state/useRunner';
import { useIsWide } from '../useMediaQuery';

const PAGE_SIZE = 50;

interface Filters {
  readonly query: string;
  readonly side: 'all' | 'BUY' | 'SELL';
  readonly category: 'all' | 'SWING' | 'DAY_TRADE';
}

const NO_FILTERS: Filters = { query: '', side: 'all', category: 'all' };

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

function SideBadge({ operation }: { readonly operation: Operation }) {
  const isBuy = operation.side === 'BUY';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`badge ${isBuy ? 'badge-info' : 'badge-accent'}`}>
        {isBuy ? 'Compra' : 'Venda'}
      </span>
      {operation.category === 'DAY_TRADE' && <span className="badge badge-warning">Day trade</span>}
    </span>
  );
}

interface RowActionsProps {
  readonly operation: Operation;
  readonly onEdit: (operation: Operation) => void;
  readonly onDelete: (operation: Operation) => void;
}

type ListProps = { readonly operations: readonly Operation[] } & Omit<RowActionsProps, 'operation'>;

function RowActions({ operation, onEdit, onDelete }: RowActionsProps) {
  const label = `${operation.ticker} em ${formatDate(operation.date)}`;
  return (
    <span className="inline-flex">
      <button
        type="button"
        className="icon-btn"
        aria-label={`Editar operação de ${label}`}
        onClick={() => onEdit(operation)}
      >
        <Icon name="pencil" size={18} />
      </button>
      <button
        type="button"
        className="icon-btn hover:text-danger"
        aria-label={`Excluir operação de ${label}`}
        onClick={() => onDelete(operation)}
      >
        <Icon name="trash" size={18} />
      </button>
    </span>
  );
}

const HEADERS: readonly { label: string; align: string }[] = [
  { label: 'Data', align: '' },
  { label: 'Ativo', align: '' },
  { label: 'Tipo', align: '' },
  { label: 'Qtd.', align: 'text-right' },
  { label: 'Preço', align: 'text-right' },
  { label: 'Total', align: 'text-right' },
  { label: 'Custos', align: 'text-right' },
];

function OperationsTable({ operations, ...actions }: ListProps) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Operações salvas neste navegador</caption>
      <thead className="text-xs text-muted">
        <tr className="border-b border-line-soft">
          {HEADERS.map((header) => (
            <th
              key={header.label}
              scope="col"
              className={`px-3 py-3 font-medium first:px-5 ${header.align}`}
            >
              {header.label}
            </th>
          ))}
          <th scope="col" className="px-3 py-3">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {operations.map((operation) => (
          <tr
            key={operation.id}
            className="border-b border-line-soft transition-colors last:border-0 hover:bg-card-subtle"
          >
            <td className="num px-5 py-2 text-xs">{formatDate(operation.date)}</td>
            <td className="px-3 py-2 font-extrabold">
              <Link to={`/carteira/${operation.ticker}`} className="hover:underline">
                {operation.ticker}
              </Link>
            </td>
            <td className="px-3 py-2">
              <SideBadge operation={operation} />
            </td>
            <td className="num px-3 py-2 text-right">{operation.quantity}</td>
            <td className="num px-3 py-2 text-right">{formatBRL(operation.unitPriceCents)}</td>
            <td className="num px-3 py-2 text-right font-semibold">
              {formatBRL(operation.quantity * operation.unitPriceCents)}
            </td>
            <td className="num px-3 py-2 text-right text-muted">
              {formatBRL(operation.feesCents)}
            </td>
            <td className="px-2 py-1 text-right">
              <RowActions operation={operation} {...actions} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OperationCards({ operations, ...actions }: ListProps) {
  return (
    <ul className="divide-y divide-line-soft" aria-label="Operações salvas">
      {operations.map((operation) => (
        <li key={operation.id} className="flex items-center gap-1 py-2 pr-1 pl-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <strong>{operation.ticker}</strong>
              <SideBadge operation={operation} />
            </p>
            <p className="num mt-1 text-xs text-muted">
              {formatDateShort(operation.date)} · {operation.quantity} ×{' '}
              {formatBRL(operation.unitPriceCents)}
            </p>
          </div>
          <RowActions operation={operation} {...actions} />
        </li>
      ))}
    </ul>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line-soft p-3 sm:flex-row">
      <div className="relative flex-1">
        <Icon
          name="search"
          size={16}
          className="pointer-events-none absolute top-3.5 left-3 text-muted"
        />
        <input
          type="search"
          aria-label="Buscar por ativo"
          placeholder="Buscar ativo (ex.: PETR4)"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          className="input pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <select
          aria-label="Filtrar por tipo"
          value={filters.side}
          onChange={(event) =>
            onChange({ ...filters, side: event.target.value as Filters['side'] })
          }
          className="input min-w-0 sm:w-44"
        >
          <option value="all">Compra e venda</option>
          <option value="BUY">Só compras</option>
          <option value="SELL">Só vendas</option>
        </select>
        <select
          aria-label="Filtrar por modalidade"
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value as Filters['category'] })
          }
          className="input min-w-0 sm:w-52"
        >
          <option value="all">Modalidades</option>
          <option value="SWING">Comum</option>
          <option value="DAY_TRADE">Day trade</option>
        </select>
      </div>
    </div>
  );
}

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Páginas" className="flex items-center gap-1">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </button>
      <span className="num px-2 text-xs text-muted" aria-live="polite">
        {page + 1} de {pages}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page >= pages - 1}
        onClick={() => onPage(page + 1)}
      >
        Próxima
      </button>
    </nav>
  );
}

function OperationsContent() {
  const { operations, paid, addMany, remove, clear, merge } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const isWide = useIsWide();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const isDialogOpen = params.get('nova') === '1' || editing !== null;
  const defaultTicker = params.get('ticker')?.toUpperCase() ?? undefined;
  const visible = applyFilters(operations, filters);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

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
    <div>
      <PageHeader
        title="Operações"
        description={`${plural(operations.length, 'operação salva', 'operações salvas')} neste navegador`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/importar" className="btn btn-secondary">
              <Icon name="upload" size={16} />
              Importar CSV
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setParams({ nova: '1' })}
            >
              <Icon name="plus" size={16} />
              Nova operação
            </button>
          </div>
        }
      />
      <Reveal>
        <section aria-label="Lista de operações" className="card overflow-hidden">
          <FilterBar
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(0);
            }}
          />
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent-surface text-accent">
                <Icon name="search" size={24} />
              </span>
              <p className="mt-4 font-bold">Nenhuma operação encontrada</p>
              <p className="mt-1 text-sm text-muted">
                {operations.length === 0
                  ? 'Adicione uma operação ou importe um CSV para começar.'
                  : 'Ajuste a busca ou os filtros para ver mais resultados.'}
              </p>
              {operations.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary mt-4"
                  onClick={() => setFilters(NO_FILTERS)}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : isWide ? (
            <OperationsTable operations={shown} {...rowActions} />
          ) : (
            <OperationCards operations={shown} {...rowActions} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft p-3">
            <p className="text-xs text-muted" aria-live="polite">
              {visible.length === 0
                ? '0 operações exibidas'
                : `${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + shown.length} de ${plural(visible.length, 'operação', 'operações')}`}
            </p>
            <Pager page={current} pages={pages} onPage={setPage} />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={visible.length === 0}
                onClick={() =>
                  downloadText('operacoes-fiscotrack.csv', operationsToCsv(visible), 'text/csv')
                }
              >
                <Icon name="download" size={16} />
                Exportar CSV
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={operations.length === 0}
                onClick={() => setIsClearing(true)}
              >
                <Icon name="trash" size={16} />
                Apagar todas
              </button>
            </div>
          </div>
        </section>
      </Reveal>
      <OperationDialog
        open={isDialogOpen}
        editing={editing}
        defaultTicker={defaultTicker}
        onClose={closeDialog}
        onSave={save}
      />
      <ConfirmDialog
        open={isClearing}
        title="Apagar todas as operações?"
        message={`As ${plural(operations.length, 'operação', 'operações')} e os DARFs marcados como pagos serão removidos deste navegador. Você pode desfazer logo em seguida, mas só um backup garante a recuperação depois.`}
        confirmLabel="Apagar tudo"
        onConfirm={() => void handleClear()}
        onCancel={() => setIsClearing(false)}
      />
    </div>
  );
}

export function OperationsPage() {
  return (
    <DataGate allowEmpty>
      <OperationsContent />
    </DataGate>
  );
}
