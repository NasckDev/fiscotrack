import { useNavigate } from 'react-router';
import { NAV_ITEMS } from '../navigation';
import type { AppMenuItem } from '../ui';

/** Item de menu ativo: `/carteira/PETR4` destaca "Carteira". */
export function activeKey(pathname: string): string {
  const match = NAV_ITEMS.filter((item) => item.to !== '/' && pathname.startsWith(item.to));
  return match[0]?.to ?? (pathname === '/' ? '/' : '');
}

export function useNavMenuItems(afterSelect?: () => void): readonly AppMenuItem[] {
  const navigate = useNavigate();
  return NAV_ITEMS.map((item) => ({
    key: item.to,
    label: item.label,
    icon: item.icon,
    onSelect: () => {
      void navigate(item.to);
      afterSelect?.();
    },
  }));
}
