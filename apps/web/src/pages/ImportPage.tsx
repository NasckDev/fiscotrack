import { formatBRL, type Operation } from '@fiscotrack/engine';
import { DataGate } from '../components/DataGate';
import { PageHeader } from '../components/PageHeader';
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
import {
  AppAlert,
  AppButton,
  AppCard,
  AppCheckbox,
  AppCol,
  AppFlex,
  AppForm,
  AppFormItem,
  AppIcon,
  AppInput,
  AppResult,
  AppRow,
  AppSelect,
  AppStack,
  AppSteps,
  AppTable,
  AppTag,
  AppText,
  AppTitle,
  AppUpload,
  useAppColors,
  type AppTableColumn,
} from '../ui';

const PREVIEW_LIMIT = 5;
const TEMPLATE = `${CSV_COLUMNS.join(';')}\n2026-01-08;PETR4;compra;100;38,20;4,90;comum\n`;

const STEPS = [
  { title: 'Escolher o arquivo', description: 'CSV da corretora' },
  { title: 'Conferir e importar', description: 'Colunas, prévia e erros' },
  { title: 'Concluído', description: 'Operações salvas' },
];

function MappingFields({
  table,
  mapping,
  onChange,
}: {
  readonly table: CsvTable;
  readonly mapping: ColumnMapping;
  readonly onChange: (key: ColumnKey, index: number | null) => void;
}) {
  return (
    <AppForm layout="vertical">
      <AppRow>
        {CSV_COLUMNS.map((key) => {
          const required = REQUIRED_COLUMNS.includes(key);
          const missing = required && mapping[key] === null;
          const options = table.headers.map((header, index) => ({
            value: index,
            label: header || `Coluna ${index + 1}`,
          }));
          return (
            <AppCol key={key} xs={24} sm={12}>
              <AppFormItem
                label={
                  <span>
                    {COLUMN_LABELS[key]}
                    {required && <span aria-hidden="true"> *</span>}
                  </span>
                }
                htmlFor={`map-${key}`}
                validateStatus={missing ? 'error' : undefined}
                help={
                  missing
                    ? `Escolha qual coluna traz ${COLUMN_LABELS[key].toLowerCase()}.`
                    : undefined
                }
              >
                <AppSelect<number>
                  id={`map-${key}`}
                  options={options}
                  value={mapping[key]}
                  status={missing ? 'error' : undefined}
                  allowClear={!required}
                  placeholder={required ? 'Escolha a coluna' : 'Não informar'}
                  onChange={(index) => onChange(key, index ?? null)}
                />
              </AppFormItem>
            </AppCol>
          );
        })}
      </AppRow>
    </AppForm>
  );
}

function OperationsPreview({ preview }: { readonly preview: ImportPreview }) {
  const shown = preview.operations.slice(0, PREVIEW_LIMIT);
  if (shown.length === 0) return null;
  const columns: readonly AppTableColumn<Operation>[] = [
    {
      title: 'Data',
      key: 'date',
      render: (_, op) => <AppText mono>{formatDateShort(op.date)}</AppText>,
    },
    {
      title: 'Ativo',
      key: 'ticker',
      render: (_, op) => (
        <AppFlex gap="small" align="center">
          <strong>{op.ticker}</strong>
          {preview.duplicateIds.has(op.id) && <AppTag tone="darf">Repetida</AppTag>}
        </AppFlex>
      ),
    },
    { title: 'Tipo', key: 'side', render: (_, op) => (op.side === 'BUY' ? 'Compra' : 'Venda') },
    {
      title: 'Qtd.',
      key: 'qty',
      align: 'right',
      render: (_, op) => <AppText mono>{op.quantity}</AppText>,
    },
    {
      title: 'Preço',
      key: 'price',
      align: 'right',
      render: (_, op) => <AppText mono>{formatBRL(op.unitPriceCents)}</AppText>,
    },
  ];
  return (
    <AppTable
      size="sm"
      ariaLabel="Prévia das primeiras operações"
      columns={columns}
      data={shown}
      rowKey={(op) => op.id}
      renderCard={(op) => (
        <AppFlex justify="space-between" align="center" gap="small">
          <span>
            <strong>{op.ticker}</strong>{' '}
            <AppText type="secondary">{op.side === 'BUY' ? 'Compra' : 'Venda'}</AppText>
            <AppText type="secondary" mono size="sm" block>
              {formatDateShort(op.date)} · {op.quantity} × {formatBRL(op.unitPriceCents)}
            </AppText>
          </span>
          {preview.duplicateIds.has(op.id) && <AppTag tone="darf">Repetida</AppTag>}
        </AppFlex>
      )}
    />
  );
}

function LineErrors({
  errors,
  onEdit,
}: {
  readonly errors: readonly ImportLineError[];
  readonly onEdit?: (line: number, text: string) => void;
}) {
  const colors = useAppColors();
  return (
    <ul
      aria-label="Linhas com erro"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}
    >
      {errors.map((error) => (
        <li
          key={error.line}
          style={{
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${colors.loss}`,
            background: colors.lossSurface,
          }}
        >
          <AppFlex gap="middle" align="flex-start">
            <AppTag tone="loss" icon="circle-alert">
              Linha {error.line}
            </AppTag>
            <AppText strong>{error.messages.join(' ')}</AppText>
          </AppFlex>
          {error.raw !== undefined &&
            (onEdit ? (
              <div style={{ marginTop: 8 }}>
                <label
                  htmlFor={`linha-${error.line}`}
                  style={{ fontSize: 13, color: colors.textMuted }}
                >
                  Corrigir a linha {error.line}
                </label>
                <AppInput
                  id={`linha-${error.line}`}
                  mono
                  spellCheck={false}
                  value={error.raw}
                  onChange={(event) => onEdit(error.line, event.target.value)}
                />
              </div>
            ) : (
              <AppText type="secondary" mono size="sm" block>
                {error.raw}
              </AppText>
            ))}
        </li>
      ))}
    </ul>
  );
}

function PreviewSummary({ preview }: { readonly preview: ImportPreview }) {
  const duplicates = preview.duplicateIds.size;
  return (
    <div aria-live="polite">
      <AppText tone="gain" strong>
        {plural(preview.toImport.length, 'operação pronta', 'operações prontas')}
      </AppText>{' '}
      <AppText>para importar</AppText>
      {preview.errors.length > 0 && (
        <>
          {' · '}
          <AppText tone="loss" strong>
            {plural(preview.errors.length, 'linha com erro', 'linhas com erro')}
          </AppText>
        </>
      )}
      {duplicates > 0 && (
        <>
          {' · '}
          <AppText tone="darf" strong>
            {plural(duplicates, 'possível repetida', 'possíveis repetidas')}
          </AppText>
        </>
      )}
      <AppText>.</AppText>
    </div>
  );
}

function FormatGuide() {
  return (
    <AppCard aria-label="Formato do arquivo">
      <AppStack>
        <AppTitle level={3}>Formato do arquivo</AppTitle>
        <AppFlex gap="small" wrap component="ul">
          {CSV_COLUMNS.map((column) => (
            <li key={column} style={{ listStyle: 'none' }}>
              <AppTag>{column}</AppTag>
            </li>
          ))}
        </AppFlex>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <AppText type="secondary">
              Separador <code>;</code>, <code>,</code> ou tabulação; campos com aspas funcionam
            </AppText>
          </li>
          <li>
            <AppText type="secondary">
              Datas em <code>AAAA-MM-DD</code> ou <code>DD/MM/AAAA</code>
            </AppText>
          </li>
          <li>
            <AppText type="secondary">
              Quantidade com milhar (<code>1.000</code>) e preço com vírgula (<code>32,50</code>)
            </AppText>
          </li>
          <li>
            <AppText type="secondary">
              Os nomes das colunas podem variar: você mapeia na próxima etapa.
            </AppText>
          </li>
        </ul>
        <AppText type="secondary" size="sm">
          <AppIcon name="shield" /> O arquivo é lido no navegador e nada é enviado a servidores.
        </AppText>
        <AppButton
          block
          icon="download"
          onClick={() => downloadText('modelo-fiscotrack.csv', TEMPLATE, 'text/csv')}
        >
          Baixar modelo de CSV
        </AppButton>
      </AppStack>
    </AppCard>
  );
}

function ImportContent() {
  const { state, preview, chooseFile, setColumn, editLine, setIgnoreDuplicates, confirm, reset } =
    useCsvImport();
  const step = state.kind === 'mapping' ? 1 : state.kind === 'done' ? 2 : 0;
  const upload = (
    <AppUpload
      accept=".csv,text/csv"
      title="Escolha o arquivo CSV da sua corretora"
      description="Arraste aqui ou clique para escolher"
      onFile={(file) => void chooseFile(file)}
    />
  );

  return (
    <AppStack>
      <PageHeader
        title="Importar CSV"
        trail={[{ label: 'Operações', to: '/operacoes' }]}
        description="Traga suas operações de um arquivo. Você confere o mapeamento das colunas e a prévia antes de salvar."
      />
      <AppSteps aria-label="Etapas da importação" current={step} items={STEPS} />
      <AppRow>
        <AppCol xs={24} lg={16}>
          <AppStack>
            {state.kind === 'idle' && upload}
            {state.kind === 'failed' && (
              <>
                <AppAlert tone="error" role="alert" title="Não foi possível importar">
                  {state.message}
                </AppAlert>
                {upload}
              </>
            )}
            {state.kind === 'mapping' && preview !== null && (
              <section aria-label="Mapeamento e prévia">
                <AppCard padding="lg">
                  <AppStack gap="large">
                    <AppText>
                      <AppIcon name="file" /> <strong>{state.fileName}</strong>{' '}
                      <AppText type="secondary">
                        · {plural(state.table.rows.length, 'linha', 'linhas')}
                      </AppText>
                    </AppText>
                    <div>
                      <AppTitle level={3}>1. Confira as colunas</AppTitle>
                      <div style={{ marginTop: 12 }}>
                        <MappingFields
                          table={state.table}
                          mapping={state.mapping}
                          onChange={setColumn}
                        />
                      </div>
                    </div>
                    <AppStack>
                      <AppTitle level={3}>2. Revise a prévia</AppTitle>
                      {missingRequired(state.mapping).length > 0 ? (
                        <AppText type="secondary">
                          Escolha as colunas obrigatórias para ver a prévia.
                        </AppText>
                      ) : (
                        <>
                          <PreviewSummary preview={preview} />
                          <OperationsPreview preview={preview} />
                          {preview.duplicateIds.size > 0 && (
                            <AppAlert tone="warning" title="Operações que já estão salvas">
                              <AppCheckbox
                                checked={state.ignoreDuplicates}
                                onChange={setIgnoreDuplicates}
                              >
                                Ignorar as {preview.duplicateIds.size} possíveis repetidas. Elas têm
                                a mesma data, ativo, tipo, quantidade e preço de operações já
                                salvas.
                              </AppCheckbox>
                            </AppAlert>
                          )}
                          {preview.errors.length > 0 && (
                            <LineErrors errors={preview.errors} onEdit={editLine} />
                          )}
                        </>
                      )}
                    </AppStack>
                    <AppFlex gap="small" justify="flex-end" wrap>
                      <AppButton onClick={reset}>Escolher outro arquivo</AppButton>
                      <AppButton
                        variant="primary"
                        icon="check"
                        disabled={
                          missingRequired(state.mapping).length > 0 || preview.toImport.length === 0
                        }
                        onClick={() => void confirm()}
                      >
                        Importar {plural(preview.toImport.length, 'operação', 'operações')}
                      </AppButton>
                    </AppFlex>
                  </AppStack>
                </AppCard>
              </section>
            )}
            {state.kind === 'done' && (
              <section aria-label="Resultado da importação" role="status">
                <AppCard padding="lg">
                  <AppResult
                    status="success"
                    title={plural(state.imported, 'operação importada', 'operações importadas')}
                    description={`${
                      state.skipped > 0
                        ? `${plural(state.skipped, 'repetida ignorada', 'repetidas ignoradas')}. `
                        : ''
                    }${
                      state.errors.length > 0
                        ? `${plural(state.errors.length, 'linha ficou de fora', 'linhas ficaram de fora')} por erro.`
                        : `Todas as linhas ${pluralWord(state.imported, 'válida foi importada', 'válidas foram importadas')}.`
                    }`}
                    actions={
                      <AppFlex gap="small" justify="center" wrap>
                        <AppButton variant="primary" to="/">
                          Ver o início
                        </AppButton>
                        <AppButton onClick={reset}>Importar outro arquivo</AppButton>
                      </AppFlex>
                    }
                  />
                  {state.errors.length > 0 && <LineErrors errors={state.errors} />}
                </AppCard>
              </section>
            )}
          </AppStack>
        </AppCol>
        <AppCol xs={24} lg={8}>
          <FormatGuide />
        </AppCol>
      </AppRow>
    </AppStack>
  );
}

export function ImportPage() {
  return (
    <DataGate allowEmpty>
      <ImportContent />
    </DataGate>
  );
}
