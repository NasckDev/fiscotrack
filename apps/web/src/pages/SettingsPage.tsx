import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataGate } from '../components/DataGate';
import { Icon, type IconName } from '../components/Icon';
import { useToasts } from '../components/Toasts';
import { Notice, PageHeader } from '../components/ui';
import { parseBackup, serializeBackup, type BackupData } from '../domain/backup';
import { toPaidMarks } from '../domain/darf';
import { plural } from '../domain/format';
import { downloadText } from '../download';
import { getLastBackup, markBackupDone } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { useExampleLoader } from '../state/useExampleLoader';
import { useRunner } from '../state/useRunner';
import { setTheme, useTheme, type Theme } from '../theme';

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-5" aria-label={title}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent-surface text-accent">
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

const THEMES: readonly { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'moon' },
];

function ThemeSection() {
  const theme = useTheme();
  return (
    <Section icon="sun" title="Aparência" description="O tema é lembrado neste navegador.">
      <div
        role="radiogroup"
        aria-label="Tema"
        className="inline-flex rounded-xl border border-line-soft bg-card-subtle p-1"
      >
        {THEMES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => setTheme(option.value)}
            className={`btn min-h-11 ${theme === option.value ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Icon name={option.icon} size={16} />
            {option.label}
          </button>
        ))}
      </div>
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn btn-secondary" onClick={exportBackup}>
          <Icon name="download" size={16} />
          Exportar backup
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="upload" size={16} />
          Restaurar backup
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Arquivo de backup"
          onChange={(event) => void chooseFile(event)}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        {lastBackup === null
          ? 'Você ainda não exportou um backup neste navegador.'
          : `Último backup: ${lastBackup.toLocaleDateString('pt-BR')}.`}
      </p>
      {error !== null && (
        <div className="mt-3">
          <Notice tone="danger" role="alert" title="Não foi possível restaurar">
            {error}
          </Notice>
        </div>
      )}
      <ConfirmDialog
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
  return (
    <p className="mt-3 text-xs text-muted">
      Espaço usado pelo app neste navegador: {formatMegabytes(usage.used)} de{' '}
      {formatMegabytes(usage.quota)} disponíveis.
    </p>
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
      icon="trash"
      title="Seus dados"
      description="Tudo fica no IndexedDB deste navegador. Nada é enviado a servidores, e não há contas nem telemetria."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isWorking}
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
          <Icon name="sparkles" size={16} />
          Carregar dados de exemplo
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={operations.length === 0}
          onClick={() => setIsConfirming(true)}
        >
          <Icon name="trash" size={16} />
          Apagar todos os dados
        </button>
      </div>
      <StorageUsage />
      <ConfirmDialog
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
      <div className="space-y-4">
        <PageHeader title="Configurações" description="Aparência, backup e privacidade." />
        <ThemeSection />
        <BackupSection />
        <DataSection />
        <p className="flex items-center gap-2 text-xs text-muted">
          <Icon name="shield" size={14} />
          Projeto educacional com dados fictícios no exemplo. Não substitui consultoria fiscal.
        </p>
      </div>
    </DataGate>
  );
}
