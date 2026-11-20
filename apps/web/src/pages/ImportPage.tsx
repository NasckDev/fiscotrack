import { formatBRL } from '@fiscotrack/engine';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { Notice, PageHeader } from '../components/ui';
import { CSV_COLUMNS, type ImportLineError } from '../domain/csv';
import {
  COLUMN_LABELS,
  REQUIRED_COLUMNS,
  missingRequired,
  type ColumnKey,
  type ColumnMapping,
  type CsvTable,
} from '../domain/csvMapping';
import { formatDateShort, plural, pluralWord } from '../domain/format';
import { downloadText } from '../download';
import { useCsvImport, type ImportPreview } from '../state/useCsvImport';

const PREVIEW_LIMIT = 5;
const TEMPLATE = `${CSV_COLUMNS.join(';')}\n2026-01-08;PETR4;compra;100;38,20;4,90;comum\n`;

function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = '';
  };
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-5 py-12 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ft-color-focus-ring)] ${
        isDragging ? 'border-accent bg-accent-surface' : 'border-line bg-card hover:bg-card-subtle'
      }`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent-surface text-accent">
        <Icon name="upload" size={24} />
      </span>
      <span className="font-bold">Escolha o arquivo CSV da sua corretora</span>
      <span className="text-sm text-muted">
        <span className="hidden sm:inline">Arraste aqui ou </span>
        <span className="font-semibold text-accent">toque para escolher</span>
      </span>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleChange}
        className="sr-only"
        aria-label="Arquivo CSV"
      />
    </label>
  );
}

function MappingTable({
  table,
  mapping,
  onChange,
}: {
  table: CsvTable;
  mapping: ColumnMapping;
  onChange: (key: ColumnKey, index: number | null) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CSV_COLUMNS.map((key) => {
        const required = REQUIRED_COLUMNS.includes(key);
        const missing = required && mapping[key] === null;
        return (
          <div key={key} className="field">
            <label htmlFor={`map-${key}`}>
              {COLUMN_LABELS[key]}
              {required && <span className="text-danger"> *</span>}
            </label>
            <select
              id={`map-${key}`}
              className="input"
              aria-invalid={missing}
              aria-describedby={missing ? `map-${key}-erro` : undefined}
              value={mapping[key] ?? ''}
              onChange={(event) =>
                onChange(key, event.target.value === '' ? null : Number(event.target.value))
              }
            >
              <option value="">{required ? 'Escolha a coluna' : 'Não informar'}</option>
              {table.headers.map((header, index) => (
                <option key={`${header}-${index}`} value={index}>
                  {header || `Coluna ${index + 1}`}
                </option>
              ))}
            </select>
            {missing && (
              <p id={`map-${key}-erro`} className="text-xs font-medium text-danger">
                Escolha qual coluna traz {COLUMN_LABELS[key].toLowerCase()}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OperationsPreview({ preview }: { preview: ImportPreview }) {
  const shown = preview.operations.slice(0, PREVIEW_LIMIT);
  if (shown.length === 0) return null;
  return (
    <>
      <ul
        className="divide-y divide-line-soft rounded-xl border border-line-soft sm:hidden"
        aria-label="Prévia das primeiras operações"
      >
        {shown.map((operation) => (
          <li
            key={operation.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
          >
            <span className="min-w-0">
              <strong>{operation.ticker}</strong>{' '}
              <span className="text-muted">{operation.side === 'BUY' ? 'Compra' : 'Venda'}</span>
              <span className="num block text-xs text-muted">
                {formatDateShort(operation.date)} · {operation.quantity} ×{' '}
                {formatBRL(operation.unitPriceCents)}
              </span>
            </span>
            {preview.duplicateIds.has(operation.id) && (
              <span className="badge badge-warning">Repetida</span>
            )}
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-line-soft sm:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Prévia das primeiras operações</caption>
          <thead className="bg-card-subtle text-xs text-muted">
            <tr>
              {['Data', 'Ativo', 'Tipo', 'Qtd.', 'Preço'].map((label, index) => (
                <th
                  key={label}
                  scope="col"
                  className={`px-3 py-2 font-medium ${index > 2 ? 'text-right' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((operation) => (
              <tr key={operation.id} className="border-t border-line-soft">
                <td className="num px-3 py-2">{formatDateShort(operation.date)}</td>
                <td className="px-3 py-2 font-bold">
                  {operation.ticker}{' '}
                  {preview.duplicateIds.has(operation.id) && (
                    <span className="badge badge-warning">Repetida</span>
                  )}
                </td>
                <td className="px-3 py-2">{operation.side === 'BUY' ? 'Compra' : 'Venda'}</td>
                <td className="num px-3 py-2 text-right">{operation.quantity}</td>
                <td className="num px-3 py-2 text-right">{formatBRL(operation.unitPriceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LineErrors({
  errors,
  onEdit,
}: {
  errors: readonly ImportLineError[];
  onEdit?: (line: number, text: string) => void;
}) {
  return (
    <ul className="space-y-2" aria-label="Linhas com erro">
      {errors.map((error) => (
        <li
          key={error.line}
          className="rounded-xl border border-danger/30 bg-danger-surface p-3 text-sm"
        >
          <div className="flex items-start gap-3">
            <span className="badge badge-danger flex-none border border-danger/30">
              Linha {error.line}
            </span>
            <span className="min-w-0 font-medium">{error.messages.join(' ')}</span>
          </div>
          {error.raw !== undefined &&
            (onEdit ? (
              <div className="field mt-2">
                <label htmlFor={`linha-${error.line}`} className="text-xs text-muted">
                  Corrigir a linha {error.line}
                </label>
                <input
                  id={`linha-${error.line}`}
                  className="input num"
                  value={error.raw}
                  onChange={(event) => onEdit(error.line, event.target.value)}
                  spellCheck={false}
                />
              </div>
            ) : (
              <p className="num mt-2 break-all text-xs text-muted">{error.raw}</p>
            ))}
        </li>
      ))}
    </ul>
  );
}

function PreviewSummary({ preview }: { preview: ImportPreview }) {
  const duplicates = preview.duplicateIds.size;
  return (
    <p className="text-sm" aria-live="polite">
      <strong className="text-success">
        {plural(preview.toImport.length, 'operação pronta', 'operações prontas')}
      </strong>{' '}
      para importar
      {preview.errors.length > 0 && (
        <>
          {' · '}
          <strong className="text-danger">
            {plural(preview.errors.length, 'linha com erro', 'linhas com erro')}
          </strong>
        </>
      )}
      {duplicates > 0 && (
        <>
          {' · '}
          <strong className="text-warning">
            {plural(duplicates, 'possível repetida', 'possíveis repetidas')}
          </strong>
        </>
      )}
      .
    </p>
  );
}

function ImportContent() {
  const { state, preview, chooseFile, setColumn, editLine, setIgnoreDuplicates, confirm, reset } =
    useCsvImport();

  return (
    <div>
      <PageHeader
        title="Importar CSV"
        description="Traga suas operações de um arquivo. Você confere o mapeamento das colunas e a prévia antes de salvar."
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          {state.kind === 'idle' && <Dropzone onFile={(file) => void chooseFile(file)} />}
          {state.kind === 'failed' && (
            <>
              <Notice tone="danger" role="alert" title="Não foi possível importar">
                {state.message}
              </Notice>
              <Dropzone onFile={(file) => void chooseFile(file)} />
            </>
          )}
          {state.kind === 'mapping' && preview !== null && (
            <section className="card space-y-5 p-5" aria-label="Mapeamento e prévia">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="file" size={18} className="text-muted" />
                <span className="font-bold">{state.fileName}</span>
                <span className="text-muted">
                  · {plural(state.table.rows.length, 'linha', 'linhas')}
                </span>
              </div>
              <div>
                <h2 className="mb-3 font-bold">1. Confira as colunas</h2>
                <MappingTable table={state.table} mapping={state.mapping} onChange={setColumn} />
              </div>
              <div className="space-y-4">
                <h2 className="font-bold">2. Revise a prévia</h2>
                {missingRequired(state.mapping).length > 0 ? (
                  <p className="text-sm text-muted">
                    Escolha as colunas obrigatórias para ver a prévia.
                  </p>
                ) : (
                  <>
                    <PreviewSummary preview={preview} />
                    <OperationsPreview preview={preview} />
                    {preview.duplicateIds.size > 0 && (
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-warning-surface p-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-[var(--ft-color-accent)]"
                          checked={state.ignoreDuplicates}
                          onChange={(event) => setIgnoreDuplicates(event.target.checked)}
                        />
                        <span>
                          <strong>
                            Ignorar as {preview.duplicateIds.size} possíveis repetidas.
                          </strong>{' '}
                          Elas têm a mesma data, ativo, tipo, quantidade e preço de operações já
                          salvas.
                        </span>
                      </label>
                    )}
                    {preview.errors.length > 0 && (
                      <LineErrors errors={preview.errors} onEdit={editLine} />
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  Escolher outro arquivo
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    missingRequired(state.mapping).length > 0 || preview.toImport.length === 0
                  }
                  onClick={() => void confirm()}
                >
                  <Icon name="check" size={16} />
                  Importar {plural(preview.toImport.length, 'operação', 'operações')}
                </button>
              </div>
            </section>
          )}
          {state.kind === 'done' && (
            <section
              role="status"
              className="card space-y-4 p-5"
              aria-label="Resultado da importação"
            >
              <Notice
                tone="success"
                title={plural(state.imported, 'operação importada', 'operações importadas')}
              >
                {state.skipped > 0 &&
                  `${plural(state.skipped, 'repetida ignorada', 'repetidas ignoradas')}. `}
                {state.errors.length > 0
                  ? `${plural(state.errors.length, 'linha ficou de fora', 'linhas ficaram de fora')} por erro.`
                  : `Todas as linhas ${pluralWord(state.imported, 'válida foi importada', 'válidas foram importadas')}.`}
              </Notice>
              {state.errors.length > 0 && <LineErrors errors={state.errors} />}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/" className="btn btn-primary">
                  Ver o início
                </Link>
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  Importar outro arquivo
                </button>
              </div>
            </section>
          )}
        </div>
        <aside className="card space-y-4 p-5" aria-label="Formato do arquivo">
          <h2 className="font-bold">Formato do arquivo</h2>
          <ul className="flex flex-wrap gap-1.5">
            {CSV_COLUMNS.map((column) => (
              <li key={column}>
                <code className="badge badge-neutral">{column}</code>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>
              Separador <code>;</code>, <code>,</code> ou tabulação; campos com aspas funcionam
            </li>
            <li>
              Datas em <code>AAAA-MM-DD</code> ou <code>DD/MM/AAAA</code>
            </li>
            <li>
              Quantidade com milhar (<code>1.000</code>) e preço com vírgula (<code>32,50</code>)
            </li>
            <li>Os nomes das colunas podem variar: você mapeia na próxima etapa.</li>
          </ul>
          <p className="flex items-start gap-2 text-sm text-muted">
            <Icon name="shield" size={16} className="mt-0.5 flex-none" />O arquivo é lido no
            navegador e nada é enviado a servidores.
          </p>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => downloadText('modelo-fiscotrack.csv', TEMPLATE, 'text/csv')}
          >
            <Icon name="download" size={16} />
            Baixar modelo de CSV
          </button>
        </aside>
      </div>
    </div>
  );
}

export function ImportPage() {
  return (
    <DataGate allowEmpty>
      <ImportContent />
    </DataGate>
  );
}
