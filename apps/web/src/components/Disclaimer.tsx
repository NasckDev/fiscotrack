import { useState } from 'react';
import { Icon } from './Icon';

const STORAGE_KEY = 'fiscotrack-disclaimer-dismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Armazenamento indisponível: o aviso reaparece na próxima visita.
  }
}

/** Faixa discreta com o aviso educacional; pode ser dispensada e a escolha é lembrada. */
export function Disclaimer() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  if (dismissed) return null;

  return (
    <aside
      aria-label="Aviso educacional"
      className="flex items-start gap-2 border-b border-line-soft bg-info-surface px-4 py-2 text-xs text-ink sm:px-6 lg:px-10"
    >
      <Icon name="info" size={16} className="mt-0.5 flex-none text-info" />
      <p className="min-w-0 flex-1 leading-relaxed">
        <strong>Ferramenta educacional.</strong> Estimativas com regras simplificadas; não substitui
        consultoria fiscal
        <span className="hidden sm:inline"> nem os sistemas da Receita Federal</span>.
        <span className="hidden sm:inline"> Seus dados ficam só neste navegador.</span>
      </p>
      <button
        type="button"
        className="-my-2 -mr-3 inline-flex h-11 w-11 flex-none items-center justify-center rounded-md text-muted hover:text-ink"
        aria-label="Dispensar aviso educacional"
        onClick={() => {
          rememberDismissal();
          setDismissed(true);
        }}
      >
        <Icon name="x" size={16} />
      </button>
    </aside>
  );
}
