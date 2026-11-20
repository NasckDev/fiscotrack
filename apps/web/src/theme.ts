import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fiscotrack-theme';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** Aplica o tema no <html> e lembra a escolha (se o armazenamento estiver disponível). */
export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Armazenamento indisponível (modo privado): o tema vale só para esta sessão.
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light');
}
