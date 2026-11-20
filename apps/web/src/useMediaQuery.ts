import { useSyncExternalStore } from 'react';

/** Acompanha uma media query. Sem `matchMedia` (testes), usa o valor de reserva. */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}

/** Tabelas só a partir do breakpoint `md` (768px); abaixo disso, listas de cards. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 768px)', true);
}
