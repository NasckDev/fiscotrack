import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { CSV_COLUMNS, parseOperationsCsv, type ImportResult } from '../domain/csv';
import { useOperations } from '../state/OperationsContext';

const EXAMPLE_URL = `${import.meta.env.BASE_URL}exemplo-operacoes.csv`;

type ImportState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'working' }
  | { readonly kind: 'failed'; readonly message: string }
  | { readonly kind: 'done'; readonly result: ImportResult };

function ImportSummary({ result }: { readonly result: ImportResult }) {
  const imported = result.operations.length;
  return (
    <div role="status" className="card space-y-2">
      <p>
        <strong>{imported}</strong> operação(ões) importada(s).{' '}
        {imported > 0 && (
          <Link to="/" className="link">
            Ver painel mensal
          </Link>
        )}
      </p>
      {result.errors.length > 0 && (
        <div>
          <h3 className="font-semibold text-red-700 dark:text-red-300">
            {result.errors.length} linha(s) com erro (não importadas)
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {result.errors.map((error) => (
              <li key={error.line}>
                Linha {error.line}: {error.messages.join(' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ImportPage() {
  const { addMany } = useOperations();
  const [state, setState] = useState<ImportState>({ kind: 'idle' });

  const importText = async (text: string) => {
    const result = parseOperationsCsv(text);
    await addMany(result.operations);
    setState({ kind: 'done', result });
  };

  const run = async (load: () => Promise<string>) => {
    setState({ kind: 'working' });
    try {
      await importText(await load());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao ler o arquivo.';
      setState({ kind: 'failed', message });
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void run(() => file.text());
  };

  const loadExample = () =>
    run(async () => {
      const response = await fetch(EXAMPLE_URL);
      if (!response.ok) throw new Error(`Exemplo indisponível (HTTP ${response.status}).`);
      return response.text();
    });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Importar CSV</h2>
      <p className="text-slate-700 dark:text-slate-300">
        Colunas esperadas (separador <code>;</code> ou <code>,</code>):{' '}
        <code>{CSV_COLUMNS.join(';')}</code>. Datas em AAAA-MM-DD ou DD/MM/AAAA; tipo{' '}
        <code>compra</code>/<code>venda</code>; modalidade <code>comum</code>/<code>daytrade</code>.
        O arquivo é lido no navegador e nada é enviado a servidores.
      </p>
      <div className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Arquivo CSV</span>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="input" />
        </label>
        <button type="button" className="btn-secondary" onClick={() => void loadExample()}>
          Usar arquivo de exemplo
        </button>
        <a href={EXAMPLE_URL} download className="link self-center">
          Baixar exemplo
        </a>
      </div>
      {state.kind === 'working' && (
        <p role="status" aria-live="polite">
          Importando…
        </p>
      )}
      {state.kind === 'failed' && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
      {state.kind === 'done' && <ImportSummary result={state.result} />}
    </div>
  );
}
