import { useState } from 'react';
import { AppAlert } from '../ui';

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

/** Faixa com o aviso educacional; pode ser dispensada e a escolha é lembrada. */
export function Disclaimer() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  if (dismissed) return null;

  return (
    <aside aria-label="Aviso educacional">
      <AppAlert
        tone="info"
        title="Ferramenta educacional: estimativas com regras simplificadas, que não substituem consultoria fiscal nem os sistemas da Receita Federal."
        closable
        onClose={() => {
          rememberDismissal();
          setDismissed(true);
        }}
      ></AppAlert>
    </aside>
  );
}
