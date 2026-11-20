import { useCallback, useMemo, useState } from 'react';
import {
  applyMapping,
  readCsvTable,
  suggestMapping,
  type ColumnKey,
  type ColumnMapping,
  type CsvTable,
} from '../domain/csvMapping';
import type { ImportResult } from '../domain/csv';
import { useOperations } from './OperationsContext';

export type ImportState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'failed'; readonly message: string }
  | {
      readonly kind: 'mapping';
      readonly fileName: string;
      readonly table: CsvTable;
      readonly mapping: ColumnMapping;
    }
  | { readonly kind: 'done'; readonly imported: number; readonly errors: ImportResult['errors'] };

const importId = (line: number) => `csv-${Date.now()}-${line}`;

/** Importação em duas etapas: lê o arquivo e sugere o mapeamento; o usuário confirma a prévia. */
export function useCsvImport() {
  const { addMany } = useOperations();
  const [state, setState] = useState<ImportState>({ kind: 'idle' });

  const chooseFile = useCallback(async (file: File) => {
    try {
      const table = readCsvTable(await file.text());
      if (table.headers.length === 0 || table.headers.every((header) => header === '')) {
        setState({
          kind: 'failed',
          message: 'O arquivo está vazio. Escolha um CSV com cabeçalho.',
        });
        return;
      }
      setState({
        kind: 'mapping',
        fileName: file.name,
        table,
        mapping: suggestMapping(table.headers),
      });
    } catch {
      setState({ kind: 'failed', message: 'Não foi possível ler o arquivo. Tente outro CSV.' });
    }
  }, []);

  const setColumn = useCallback((key: ColumnKey, index: number | null) => {
    setState((current) =>
      current.kind === 'mapping'
        ? { ...current, mapping: { ...current.mapping, [key]: index } }
        : current,
    );
  }, []);

  const preview = useMemo<ImportResult | null>(
    () => (state.kind === 'mapping' ? applyMapping(state.table, state.mapping, importId) : null),
    [state],
  );

  const confirm = useCallback(async () => {
    if (state.kind !== 'mapping' || preview === null) return;
    try {
      await addMany(preview.operations);
      setState({ kind: 'done', imported: preview.operations.length, errors: preview.errors });
    } catch {
      setState({ kind: 'failed', message: 'Não foi possível salvar as operações. Tente de novo.' });
    }
  }, [state, preview, addMany]);

  const reset = useCallback(() => setState({ kind: 'idle' }), []);

  return { state, preview, chooseFile, setColumn, confirm, reset };
}
