import type { Operation } from '@fiscotrack/engine';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { csvRowSchema, rowToOperation } from '../domain/csv';
import { centsToInput } from '../domain/csvExport';
import { todayIso } from '../domain/darf';
import { Icon } from './Icon';
import { Modal } from './Modal';

type FieldName = 'data' | 'ticker' | 'tipo' | 'quantidade' | 'preco' | 'taxas' | 'modalidade';
type FieldErrors = Partial<Record<FieldName, string>>;

interface OperationDialogProps {
  readonly open: boolean;
  /** Operação em edição; `null` cria uma nova. */
  readonly editing: Operation | null;
  /** Ticker já preenchido ao criar (ex.: "Nova operação deste ativo"). */
  readonly defaultTicker?: string;
  readonly onClose: () => void;
  /** Devolve uma mensagem de erro (mostrada no diálogo) ou null quando salvou. */
  readonly onSave: (operation: Operation, isEdit: boolean) => Promise<string | null>;
}

function readForm(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  return Object.fromEntries(
    [...data.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  );
}

function Field({
  name,
  label,
  error,
  className = '',
  children,
}: {
  name: FieldName;
  label: string;
  error: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={`op-${name}`}>{label}</label>
      {children}
      {error !== undefined && (
        <p id={`op-${name}-erro`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function errorProps(name: FieldName, errors: FieldErrors) {
  return {
    id: `op-${name}`,
    name,
    'aria-invalid': errors[name] !== undefined,
    'aria-describedby': errors[name] !== undefined ? `op-${name}-erro` : undefined,
  } as const;
}

/** Cria o `seq` de uma operação nova; edições preservam o original. */
const newSeq = () => Date.now() * 1000;

function OperationForm({
  editing,
  defaultTicker,
  onClose,
  onSave,
}: Omit<OperationDialogProps, 'open'>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Leva o foco ao primeiro campo inválido depois que os erros aparecem.
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = csvRowSchema.safeParse(readForm(event.currentTarget));
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key !== undefined && next[key] === undefined) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSaveError(null);
    setIsSaving(true);
    const id = editing?.id ?? `manual-${crypto.randomUUID()}`;
    try {
      setSaveError(
        await onSave(rowToOperation(parsed.data, id, editing?.seq ?? newSeq()), editing !== null),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      ref={formRef}
      className="grid grid-cols-2 gap-4"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <Field name="data" label="Data" error={errors.data}>
        <input
          {...errorProps('data', errors)}
          type="date"
          required
          max={todayIso()}
          defaultValue={editing?.date}
          data-autofocus
          className="input"
        />
      </Field>
      <Field name="ticker" label="Ativo (ticker)" error={errors.ticker}>
        <input
          {...errorProps('ticker', errors)}
          required
          placeholder="PETR4"
          autoCapitalize="characters"
          defaultValue={editing?.ticker ?? defaultTicker}
          className="input uppercase"
        />
      </Field>
      <Field name="tipo" label="Tipo" error={errors.tipo}>
        <select
          {...errorProps('tipo', errors)}
          defaultValue={editing?.side === 'SELL' ? 'venda' : 'compra'}
          className="input"
        >
          <option value="compra">Compra</option>
          <option value="venda">Venda</option>
        </select>
      </Field>
      <Field name="modalidade" label="Modalidade" error={errors.modalidade}>
        <select
          {...errorProps('modalidade', errors)}
          defaultValue={editing?.category === 'DAY_TRADE' ? 'daytrade' : 'comum'}
          className="input"
        >
          <option value="comum">Comum</option>
          <option value="daytrade">Day trade</option>
        </select>
      </Field>
      <Field name="quantidade" label="Quantidade" error={errors.quantidade}>
        <input
          {...errorProps('quantidade', errors)}
          inputMode="numeric"
          required
          defaultValue={editing?.quantity}
          className="input num"
        />
      </Field>
      <Field name="preco" label="Preço unitário (R$)" error={errors.preco}>
        <input
          {...errorProps('preco', errors)}
          inputMode="decimal"
          required
          placeholder="32,50"
          defaultValue={editing ? centsToInput(editing.unitPriceCents) : undefined}
          className="input num"
        />
      </Field>
      <Field
        name="taxas"
        label="Custos da operação (R$)"
        error={errors.taxas}
        className="col-span-2"
      >
        <input
          {...errorProps('taxas', errors)}
          inputMode="decimal"
          defaultValue={editing ? centsToInput(editing.feesCents) : '0'}
          className="input num"
        />
      </Field>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="col-span-2 text-sm font-medium text-danger">
          Corrija os campos destacados e salve de novo.
        </p>
      )}
      {saveError !== null && (
        <p
          role="alert"
          className="col-span-2 rounded-lg bg-danger-surface p-3 text-sm font-medium text-danger"
        >
          {saveError}
        </p>
      )}
      <div className="col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          <Icon name={editing ? 'check' : 'plus'} size={16} />
          {editing ? 'Salvar alterações' : 'Adicionar operação'}
        </button>
      </div>
    </form>
  );
}

/** Diálogo para lançar ou editar uma operação, com erro ligado a cada campo. */
export function OperationDialog({
  open,
  editing,
  defaultTicker,
  onClose,
  onSave,
}: OperationDialogProps) {
  return (
    <Modal open={open} title={editing ? 'Editar operação' : 'Nova operação'} onClose={onClose}>
      <OperationForm
        editing={editing}
        defaultTicker={defaultTicker}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
