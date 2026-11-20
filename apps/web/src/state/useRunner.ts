import { useCallback } from 'react';
import { useToasts } from '../components/Toasts';
import { describeStorageError } from '../domain/errors';

/** Executa uma gravação e, se falhar, mostra um aviso com o que fazer. Devolve se deu certo. */
export function useRunner() {
  const toasts = useToasts();
  return useCallback(
    async (action: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      try {
        await action();
        return true;
      } catch (error: unknown) {
        toasts.show(describeStorageError(error, fallback), { tone: 'danger' });
        return false;
      }
    },
    [toasts],
  );
}
