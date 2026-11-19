import { formatBRL } from '@fiscotrack/engine';
import { useState, type FormEvent } from 'react';
import { csvRowSchema, rowToOperation } from '../domain/csv';
import { formatDate } from '../domain/format';
import { useOperations } from '../state/OperationsContext';

function readForm(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  return Object.fromEntries(
    [...data.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  );
}

function OperationForm() {
  const { addMany } = useOperations();
  const [errors, setErrors] = useState<readonly string[]>([]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = csvRowSchema.safeParse(readForm(form));
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    await addMany([rowToOperation(parsed.data, `manual-${crypto.randomUUID()}`)]);
    form.reset();
  };

  return (
    <form
      className="card grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => void handleSubmit(event)}
      aria-describedby="form-erros"
      noValidate
    >
      <label className="field">
        Data
        <input name="data" type="date" required className="input" />
      </label>
      <label className="field">
        Ticker
        <input name="ticker" required placeholder="PETR4" className="input uppercase" />
      </label>
      <label className="field">
        Tipo
        <select name="tipo" className="input">
          <option value="compra">Compra</option>
          <option value="venda">Venda</option>
        </select>
      </label>
      <label className="field">
        Modalidade
        <select name="modalidade" className="input">
          <option value="comum">Operação comum</option>
          <option value="daytrade">Day trade</option>
        </select>
      </label>
      <label className="field">
        Quantidade
        <input name="quantidade" inputMode="numeric" required className="input" />
      </label>
      <label className="field">
        Preço unitário (R$)
        <input name="preco" inputMode="decimal" required placeholder="32,50" className="input" />
      </label>
      <label className="field">
        Custos da operação (R$)
        <input name="taxas" inputMode="decimal" defaultValue="0" className="input" />
      </label>
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full">
          Adicionar operação
        </button>
      </div>
      <div id="form-erros" aria-live="assertive" className="sm:col-span-2">
        {errors.length > 0 && (
          <ul role="alert" className="list-disc pl-5 text-sm text-red-700 dark:text-red-300">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}

export function OperationsPage() {
  const { operations, remove, clear } = useOperations();
  const sorted = [...operations].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Operações</h2>
      <OperationForm />
      {sorted.length === 0 ? (
        <p>Nenhuma operação lançada.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Operações salvas neste navegador</caption>
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-600">
                <th scope="col" className="py-2 pr-3">Data</th>
                <th scope="col" className="py-2 pr-3">Ticker</th>
                <th scope="col" className="py-2 pr-3">Tipo</th>
                <th scope="col" className="py-2 pr-3 text-right">Qtd.</th>
                <th scope="col" className="py-2 pr-3 text-right">Preço</th>
                <th scope="col" className="py-2 pr-3 text-right">Custos</th>
                <th scope="col" className="py-2">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((operation) => (
                <tr key={operation.id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="py-2 pr-3">{formatDate(operation.date)}</td>
                  <td className="py-2 pr-3">{operation.ticker}</td>
                  <td className="py-2 pr-3">
                    {operation.side === 'BUY' ? 'Compra' : 'Venda'}
                    {operation.category === 'DAY_TRADE' ? ' (day trade)' : ''}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{operation.quantity}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatBRL(operation.unitPriceCents)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatBRL(operation.feesCents)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="link"
                      onClick={() => void remove(operation.id)}
                      aria-label={`Excluir operação de ${operation.ticker} em ${formatDate(operation.date)}`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn-secondary mt-3" onClick={() => void clear()}>
            Apagar todas as operações
          </button>
        </div>
      )}
    </div>
  );
}
