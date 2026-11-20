import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataGate } from '../components/DataGate';
import { Icon, type IconName } from '../components/Icon';
import { useToasts } from '../components/Toasts';
import { Notice, PageHeader } from '../components/ui';
import { parseBackup, serializeBackup } from '../domain/backup';
import { plural } from '../domain/format';
import { downloadText } from '../download';
import { useOperations } from '../state/OperationsContext';
import { useExampleLoader } from '../state/useExampleLoader';
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
          <h3 className="font-bold">{title}</h3>
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
  const { operations, paidMonths, restore } = useOperations();
  const toasts = useToasts();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const exportBackup = () => {
    const text = serializeBackup({ operations, paidDarfs: [...paidMonths] });
    downloadText('backup-fiscotrack.json', text, 'application/json');
    toasts.show('Backup baixado.');
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    await restore(result.data.operations, result.data.paidDarfs);
    toasts.show(
      `Backup restaurado: ${plural(result.data.operations.length, 'operação', 'operações')}.`,
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
          onChange={(event) => void importBackup(event)}
        />
      </div>
      {error !== null && (
        <div className="mt-3">
          <Notice tone="danger" role="alert" title="Não foi possível restaurar">
            {error}
          </Notice>
        </div>
      )}
    </Section>
  );
}

function DataSection() {
  const { operations, clear } = useOperations();
  const { load, isWorking } = useExampleLoader();
  const toasts = useToasts();
  const [isConfirming, setIsConfirming] = useState(false);

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
            void load().then(
              (ok) => ok && toasts.show('Exemplo carregado. Todos os dados são fictícios.'),
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
      <ConfirmDialog
        open={isConfirming}
        title="Apagar todos os dados?"
        message="Operações e DARFs marcados como pagos serão removidos deste navegador. Exporte um backup antes se quiser guardá-los."
        confirmLabel="Apagar tudo"
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => {
          setIsConfirming(false);
          void clear().then(() => toasts.show('Dados apagados deste navegador.'));
        }}
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
