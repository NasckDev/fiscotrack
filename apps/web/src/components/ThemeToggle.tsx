import { useState } from 'react';

const STORAGE_KEY = 'fiscotrack-theme';

function persistTheme(isDark: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    // Armazenamento indisponível (modo privado): o tema vale só para esta sessão.
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    persistTheme(next);
    setIsDark(next);
  };

  return (
    <button type="button" className="btn-secondary" aria-pressed={isDark} onClick={toggle}>
      {isDark ? 'Tema claro' : 'Tema escuro'}
    </button>
  );
}
