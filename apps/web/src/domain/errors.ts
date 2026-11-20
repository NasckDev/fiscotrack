/** Mensagem útil para falhas de gravação local (cota cheia, banco bloqueado, etc.). */
export function describeStorageError(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Armazenamento cheio: exporte um backup e libere espaço no navegador.';
  }
  if (error instanceof DOMException && error.name === 'InvalidStateError') {
    return `${fallback} A conexão com os dados locais foi interrompida: atualize a página.`;
  }
  return fallback;
}
