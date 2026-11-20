import { useCallback, useMemo, useState } from 'react';
import type { ImportResult } from '../domain/csv';
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  applyMapping,
  findDuplicates,
  readCsvTable,
  suggestMapping,
  type ColumnKey,
  type ColumnMapping,
  type CsvTable,
} from '../domain/csvMapping';
import { describeStorageError } from '../domain/errors';
import { useOperations } from './OperationsContext';

export type ImportState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'failed'; readonly message: string }
  | {
      readonly kind: 'mapping';
      readonly fileName: string;
      readonly table: CsvTable;
      readonly mapping: ColumnMapping;
      readonly edits: Readonly<Record<number, string>>;
      readonly ignoreDuplicates: boolean;
      readonly seqBase: number;
    }
  | {
      readonly kind: 'done';
      readonly imported: number;
      readonly skipped: number;
      readonly errors: ImportResult['errors'];
    };

export interface ImportPreview extends ImportResult {
  /** Ids das operações que repetem uma já salva. */
  readonly duplicateIds: ReadonlySet<string>;
  /** Operações que serão gravadas (sem as duplicadas, se o usuário optou por ignorá-las). */
  readonly toImport: ImportResult['operations'];
}

const EMPTY_IDS: ReadonlySet<string> = new Set();

/** Importação em duas etapas: lê o arquivo e sugere o mapeamento; o usuário confirma a prévia. */
export function useCsvImport() {
  const { addMany, operations } = useOperations();
  const [state, setState] = useState<ImportState>({ kind: 'idle' });

  const chooseFile = useCallback(async (file: File) => {
    const fail = (message: string) => setState({ kind: 'failed', message });
    if (file.size > MAX_IMPORT_BYTES) {
      fail('O arquivo tem mais de 2 MB. Divida em partes menores e importe uma por vez.');
      return;
    }
    try {
      const table = readCsvTable(await file.text());
      if (table.headers.every((header) => header === '')) {
        fail('O arquivo está vazio. Escolha um CSV com cabeçalho na primeira linha.');
        return;
      }
      if (table.rows.length > MAX_IMPORT_ROWS) {
        fail(
          `O arquivo tem ${table.rows.length} linhas; o limite é ${MAX_IMPORT_ROWS}. Divida em partes menores.`,
        );
        return;
      }
      setState({
        kind: 'mapping',
        fileName: file.name,
        table,
        mapping: suggestMapping(table.headers),
        edits: {},
        ignoreDuplicates: true,
        seqBase: Date.now() * 1000,
      });
    } catch {
      fail('Não foi possível ler o arquivo. Tente outro CSV.');
    }
  }, []);

  const update = useCallback((change: Partial<Extract<ImportState, { kind: 'mapping' }>>) => {
    setState((current) => (current.kind === 'mapping' ? { ...current, ...change } : current));
  }, []);

  const setColumn = useCallback((key: ColumnKey, index: number | null) => {
    setState((current) =>
      current.kind === 'mapping'
        ? { ...current, mapping: { ...current.mapping, [key]: index } }
        : current,
    );
  }, []);

  const editLine = useCallback((line: number, text: string) => {
    setState((current) =>
      current.kind === 'mapping'
        ? { ...current, edits: { ...current.edits, [line]: text } }
        : current,
    );
  }, []);

  const preview = useMemo<ImportPreview | null>(() => {
    if (state.kind !== 'mapping') return null;
    const result = applyMapping(state.table, state.mapping, {
      edits: state.edits,
      seqBase: state.seqBase,
    });
    const duplicateIds =
      result.operations.length > 0 ? findDuplicates(result.operations, operations) : EMPTY_IDS;
    const toImport = state.ignoreDuplicates
      ? result.operations.filter((operation) => !duplicateIds.has(operation.id))
      : result.operations;
    return { ...result, duplicateIds, toImport };
  }, [state, operations]);

  const confirm = useCallback(async () => {
    if (state.kind !== 'mapping' || preview === null) return;
    try {
      await addMany(preview.toImport);
      setState({
        kind: 'done',
        imported: preview.toImport.length,
        skipped: preview.operations.length - preview.toImport.length,
        errors: preview.errors,
      });
    } catch (error: unknown) {
      setState({
        kind: 'failed',
        message: describeStorageError(
          error,
          'Não foi possível salvar as operações. Tente de novo.',
        ),
      });
    }
  }, [state, preview, addMany]);

  const reset = useCallback(() => setState({ kind: 'idle' }), []);

  return {
    state,
    preview,
    chooseFile,
    setColumn,
    editLine,
    setIgnoreDuplicates: (value: boolean) => update({ ignoreDuplicates: value }),
    confirm,
    reset,
  };
}
