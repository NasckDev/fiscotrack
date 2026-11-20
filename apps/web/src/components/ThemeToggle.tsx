import { setTheme, useTheme } from '../theme';
import { Icon } from './Icon';

export function ThemeToggle() {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
    </button>
  );
}
