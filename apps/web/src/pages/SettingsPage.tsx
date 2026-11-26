import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { DataGate } from '../components/DataGate';
import { PageHeader } from '../components/PageHeader';
import { parseBackup, serializeBackup, type BackupData } from '../domain/backup';
import { toPaidMarks } from '../domain/darf';
import { plural } from '../domain/format';
import { downloadText } from '../download';
import { getLastBackup, markBackupDone } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { useExampleLoader } from '../state/useExampleLoader';
import { useRunner } from '../state/useRunner';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppConfirm,
  AppFlex,
  AppIcon,
  AppProgress,
  AppSegmented,
  AppStack,
  AppText,
  AppTitle,
  setTheme,
  useAppColors,
  useTheme,
  useToasts,
  type AppIconName,
  type Theme,
} from '../ui';

function Section({
  icon,
  title,
  description,
  children,
}: {
  readonly icon: AppIconName;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  const colors = useAppColors();
  return (
    <section aria-label={title}>
      <AppCard padding="lg">
        <AppFlex gap="middle" align="flex-start" wrap>
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              background: colors.primarySurface,
              color: colors.primary,
            }}
          >
            <AppIcon name={icon} />
          </span>
          <div style={{ minWidth: 0, flex: '1 1 220px' }}>
            <AppTitle level={2}>{title}</AppTitle>
            <AppText type="secondary" block>
              {description}
            </AppText>
            <div style={{ marginTop: 16 }}>{children}</div>
          </div>
        </AppFlex>
      </AppCard>
    </section>
  );
}

function ThemeSection() {
  const theme = useTheme();
  return (
    <Section icon="sun" title="Aparência" description="O tema é lembrado neste navegador.">
      <AppSegmented<Theme>
        aria-label="Tema"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: 'Claro', icon: 'sun' },
          { value: 'dark', label: 'Escuro', icon: 'moon' },
        ]}
      />
    </Section>
  );
}

function BackupSection() {
  const { operations, paid, restore } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<BackupData | null>(null);
  const [lastBackup, setLastBackup] = useState(getLastBackup);

  const exportBackup = () => {
    downloadText(
      'backup-fiscotrack.json',
      serializeBackup({ operations, paidDarfs: toPaidMarks(paid) }),
      'application/json',
    );
    markBackupDone();
    setLastBackup(getLastBackup());
    toasts.show('Backup baixado.');
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setPending(result.data);
  };

  const confirmRestore = async () => {
    if (pending === null) return;
    const incoming = pending;
    const snapshot = { operations, paid: toPaidMarks(paid) };
    setPending(null);
    const ok = await run(
      () => restore(incoming.operations, incoming.paidDarfs),
      'Não foi possível restaurar o backup.',
    );
    if (!ok) return;
    toasts.show(
      `Backup restaurado: ${plural(incoming.operations.length, 'operação', 'operações')}.`,
      {
        action: {
          label: 'Desfazer',
          run: () =>
            void run(
              () => restore(snapshot.operations, snapshot.paid),
              'Não foi possível desfazer.',
            ),
        },
      },
    );
  };

  return (
    <Section
      icon="download"
      title="Backup dos dados"
      description="Exporte tudo em um arquivo JSON e restaure em outro navegador. Restaurar substitui os dados atuais."
    >
      <AppStack>
        <AppFlex gap="small" wrap>
          <AppButton icon="download" onClick={exportBackup}>
            Exportar backup
          </AppButton>
          <AppButton icon="upload" onClick={() => inputRef.current?.click()}>
            Restaurar backup
          </AppButton>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            tabIndex={-1}
            aria-label="Arquivo de backup"
            onChange={(event) => void chooseFile(event)}
          />
        </AppFlex>
        <AppText type="secondary" size="sm">
          {lastBackup === null
            ? 'Você ainda não exportou um backup neste navegador.'
            : `Último backup: ${lastBackup.toLocaleDateString('pt-BR')}.`}
        </AppText>
        {error !== null && (
          <AppAlert tone="error" role="alert" title="Não foi possível restaurar">
            {error}
          </AppAlert>
        )}
      </AppStack>
      <AppConfirm
        open={pending !== null}
        title="Restaurar este backup?"
        message={`Isto substitui ${plural(operations.length, 'operação', 'operações')} deste navegador por ${plural(pending?.operations.length ?? 0, 'operação', 'operações')} do arquivo. Você poderá desfazer logo em seguida.`}
        confirmLabel="Substituir dados"
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmRestore()}
      />
    </Section>
  );
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB`;
}

function StorageUsage() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void navigator.storage
      ?.estimate?.()
      .then((estimate) => {
        if (!cancelled && estimate.usage !== undefined && estimate.quota !== undefined) {
          setUsage({ used: estimate.usage, quota: estimate.quota });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  if (usage === null) return null;
  const percent = usage.quota === 0 ? 0 : (usage.used / usage.quota) * 100;
  return (
    <div>
      <AppProgress
        percent={Math.max(percent, 1)}
        label="Espaço de armazenamento usado"
        valueText={`${formatMegabytes(usage.used)} de ${formatMegabytes(usage.quota)}`}
      />
      <AppText type="secondary" size="sm">
        Espaço usado pelo app neste navegador: {formatMegabytes(usage.used)} de{' '}
        {formatMegabytes(usage.quota)} disponíveis.
      </AppText>
    </div>
  );
}

function DataSection() {
  const { operations, clear, merge, paid } = useOperations();
  const { load, isWorking } = useExampleLoader();
  const toasts = useToasts();
  const run = useRunner();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClear = async () => {
    const snapshot = { operations, paid: toPaidMarks(paid) };
    setIsConfirming(false);
    if (!(await run(clear, 'Não foi possível apagar os dados.'))) return;
    toasts.show('Dados apagados deste navegador.', {
      action: {
        label: 'Desfazer',
        run: () =>
          void run(() => merge(snapshot.operations, snapshot.paid), 'Não foi possível desfazer.'),
      },
    });
  };

  return (
    <Section
      icon="shield"
      title="Seus dados"
      description="Tudo fica no IndexedDB deste navegador. Nada é enviado a servidores, e não há contas nem telemetria."
    >
      <AppStack>
        <AppFlex gap="small" wrap>
          <AppButton
            icon="sparkles"
            loading={isWorking}
            onClick={() =>
              void load().then((ok) =>
                toasts.show(
                  ok
                    ? 'Exemplo carregado. Todos os dados são fictícios.'
                    : 'Não foi possível carregar o exemplo. Tente de novo.',
                  ok ? {} : { tone: 'danger' },
                ),
              )
            }
          >
            Carregar dados de exemplo
          </AppButton>
          <AppButton
            danger
            icon="trash"
            disabled={operations.length === 0}
            onClick={() => setIsConfirming(true)}
          >
            Apagar todos os dados
          </AppButton>
        </AppFlex>
        <StorageUsage />
      </AppStack>
      <AppConfirm
        open={isConfirming}
        title="Apagar todos os dados?"
        message="Operações e DARFs marcados como pagos serão removidos deste navegador. Você pode desfazer logo em seguida; para guardá-los de verdade, exporte um backup antes."
        confirmLabel="Apagar tudo"
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => void handleClear()}
      />
    </Section>
  );
}

export function SettingsPage() {
  return (
    <DataGate allowEmpty>
      <AppStack>
        <PageHeader
          title="Configurações"
          trail={[]}
          description="Aparência, backup e privacidade."
        />
        <ThemeSection />
        <BackupSection />
        <DataSection />
        <AppText type="secondary" size="sm">
          <AppIcon name="shield" /> Projeto educacional com dados fictícios no exemplo. Não
          substitui consultoria fiscal.
        </AppText>
      </AppStack>
    </DataGate>
  );
}
