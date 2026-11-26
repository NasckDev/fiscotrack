import type { Operation } from '@fiscotrack/engine';
import { useState } from 'react';
import { csvRowSchema, rowToOperation } from '../domain/csv';
import { centsToInput } from '../domain/csvExport';
import { todayIso } from '../domain/darf';
import {
  AppAlert,
  AppButton,
  AppDatePicker,
  AppDrawer,
  AppFlex,
  AppForm,
  AppFormItem,
  AppInput,
  AppModal,
  AppRow,
  AppCol,
  AppSelect,
  useAppColors,
  useAppForm,
  useIsMobile,
  type AppFormRule,
} from '../ui';

type FieldName = 'data' | 'ticker' | 'tipo' | 'quantidade' | 'preco' | 'taxas' | 'modalidade';

interface FormValues {
  data: string | null;
  ticker: string;
  tipo: string;
  quantidade: string;
  preco: string;
  taxas: string;
  modalidade: string;
}

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

const TYPE_OPTIONS = [
  { value: 'compra', label: 'Compra' },
  { value: 'venda', label: 'Venda' },
];
const CATEGORY_OPTIONS = [
  { value: 'comum', label: 'Comum' },
  { value: 'daytrade', label: 'Day trade' },
];

/** O Form do Ant Design usa o `name` como id do `<form>`; o botão do rodapé da gaveta envia por ele. */
const FORM_NAME = 'operacao';

/** Cria o `seq` de uma operação nova; edições preservam o original. */
const newSeq = () => Date.now() * 1000;

interface OperationActionsProps {
  readonly editing: Operation | null;
  readonly isSaving: boolean;
  readonly onClose: () => void;
}

function OperationActions({ editing, isSaving, onClose }: OperationActionsProps) {
  return (
    <AppFlex gap="small" justify="flex-end">
      <AppButton onClick={onClose}>Cancelar</AppButton>
      <AppButton
        variant="primary"
        htmlType="submit"
        form={FORM_NAME}
        loading={isSaving}
        icon={editing ? 'check' : 'plus'}
      >
        {editing ? 'Salvar alterações' : 'Adicionar operação'}
      </AppButton>
    </AppFlex>
  );
}

interface OperationFormProps extends Omit<OperationDialogProps, 'open'> {
  readonly isSaving: boolean;
  readonly onSavingChange: (isSaving: boolean) => void;
  /** No celular os botões ficam no rodapé da gaveta, fora da área que rola, sem cobrir campos. */
  readonly inlineActions: boolean;
}

/** Texto de cada campo como o schema do CSV espera (campos vazios viram texto vazio). */
function toRaw(values: Partial<FormValues>): Record<FieldName, string> {
  return {
    data: values.data ?? '',
    ticker: values.ticker ?? '',
    tipo: values.tipo ?? '',
    quantidade: values.quantidade ?? '',
    preco: values.preco ?? '',
    taxas: values.taxas ?? '',
    modalidade: values.modalidade ?? '',
  };
}

function initialValues(editing: Operation | null, defaultTicker: string | undefined): FormValues {
  if (editing) {
    return {
      data: editing.date,
      ticker: editing.ticker,
      tipo: editing.side === 'SELL' ? 'venda' : 'compra',
      quantidade: String(editing.quantity),
      preco: centsToInput(editing.unitPriceCents),
      taxas: centsToInput(editing.feesCents),
      modalidade: editing.category === 'DAY_TRADE' ? 'daytrade' : 'comum',
    };
  }
  return {
    data: todayIso(),
    ticker: defaultTicker ?? '',
    tipo: 'compra',
    quantidade: '',
    preco: '',
    taxas: '0',
    modalidade: 'comum',
  };
}

function OperationForm({
  editing,
  defaultTicker,
  onClose,
  onSave,
  isSaving,
  onSavingChange,
  inlineActions,
}: OperationFormProps) {
  const [form] = useAppForm<FormValues>();
  const colors = useAppColors();
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Valida o campo com o mesmo schema da importação, para as mensagens serem iguais. */
  const rule = (name: FieldName): AppFormRule => ({
    validator: () => {
      const parsed = csvRowSchema.safeParse(toRaw(form.getFieldsValue()));
      const issue = parsed.success
        ? undefined
        : parsed.error.issues.find((item) => item.path[0] === name);
      return issue ? Promise.reject(new Error(issue.message)) : Promise.resolve();
    },
  });

  const handleFinish = async (values: FormValues) => {
    const parsed = csvRowSchema.safeParse(toRaw(values));
    if (!parsed.success) return;
    setSaveError(null);
    onSavingChange(true);
    const id = editing?.id ?? `manual-${crypto.randomUUID()}`;
    try {
      setSaveError(
        await onSave(rowToOperation(parsed.data, id, editing?.seq ?? newSeq()), editing !== null),
      );
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <AppForm<FormValues>
      form={form}
      name={FORM_NAME}
      initialValues={initialValues(editing, defaultTicker)}
      onFinish={handleFinish}
    >
      <AppRow>
        <AppCol xs={24} sm={12}>
          <AppFormItem
            name="data"
            label="Data"
            rules={[rule('data')]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <AppDatePicker max={todayIso()} />
          </AppFormItem>
        </AppCol>
        <AppCol xs={24} sm={12}>
          <AppFormItem
            name="ticker"
            label="Ativo (ticker)"
            rules={[rule('ticker')]}
            validateTrigger="onBlur"
            normalize={(value) => value.toUpperCase()}
          >
            <AppInput placeholder="PETR4" autoCapitalize="characters" autoFocus />
          </AppFormItem>
        </AppCol>
        <AppCol xs={12} sm={12}>
          <AppFormItem name="tipo" label="Tipo" rules={[rule('tipo')]}>
            <AppSelect options={TYPE_OPTIONS} />
          </AppFormItem>
        </AppCol>
        <AppCol xs={12} sm={12}>
          <AppFormItem name="modalidade" label="Modalidade" rules={[rule('modalidade')]}>
            <AppSelect options={CATEGORY_OPTIONS} />
          </AppFormItem>
        </AppCol>
        <AppCol xs={12} sm={12}>
          <AppFormItem
            name="quantidade"
            label="Quantidade"
            rules={[rule('quantidade')]}
            validateTrigger="onBlur"
          >
            <AppInput mono inputMode="numeric" placeholder="100" />
          </AppFormItem>
        </AppCol>
        <AppCol xs={12} sm={12}>
          <AppFormItem
            name="preco"
            label="Preço unitário (R$)"
            rules={[rule('preco')]}
            validateTrigger="onBlur"
          >
            <AppInput mono inputMode="decimal" placeholder="32,50" />
          </AppFormItem>
        </AppCol>
        <AppCol xs={24}>
          <AppFormItem
            name="taxas"
            label="Custos da operação (R$)"
            rules={[rule('taxas')]}
            validateTrigger="onBlur"
          >
            <AppInput mono inputMode="decimal" />
          </AppFormItem>
        </AppCol>
      </AppRow>
      {saveError !== null && <AppAlert tone="error" role="alert" title={saveError} />}
      {inlineActions && (
        <div
          style={{
            position: 'sticky',
            bottom: -24,
            zIndex: 1,
            marginTop: 16,
            padding: '12px 0 8px',
            background: colors.bgContainer,
            borderTop: `1px solid ${colors.borderSoft}`,
          }}
        >
          <OperationActions editing={editing} isSaving={isSaving} onClose={onClose} />
        </div>
      )}
    </AppForm>
  );
}

/** Lançar ou editar uma operação: modal no desktop e gaveta inferior no celular, com erro por campo. */
export function OperationDialog({
  open,
  editing,
  defaultTicker,
  onClose,
  onSave,
}: OperationDialogProps) {
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);
  const title = editing ? 'Editar operação' : 'Nova operação';
  const form = (
    <OperationForm
      editing={editing}
      defaultTicker={defaultTicker}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      onSavingChange={setIsSaving}
      inlineActions={!isMobile}
    />
  );
  if (isMobile) {
    return (
      <AppDrawer
        open={open}
        title={title}
        onClose={onClose}
        placement="bottom"
        footer={<OperationActions editing={editing} isSaving={isSaving} onClose={onClose} />}
      >
        {form}
      </AppDrawer>
    );
  }
  return (
    <AppModal open={open} title={title} onClose={onClose}>
      {form}
    </AppModal>
  );
}
