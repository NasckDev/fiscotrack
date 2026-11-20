const KEY = 'fiscotrack-visited';

/** Primeira visita = nunca carregou nem apagou dados neste navegador. */
export function hasVisited(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Sem armazenamento: o exemplo não é recarregado automaticamente.
  }
}
