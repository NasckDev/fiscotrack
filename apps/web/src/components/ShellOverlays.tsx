import { useLocation, useNavigate } from 'react-router';
import { AppDrawer, AppMenu, type AppMenuItem } from '../ui';
import { CommandPalette } from './CommandPalette';
import { activeKey, useNavMenuItems } from './navMenu';
import { ShortcutsModal } from './ShortcutsModal';

function MobileNavDrawer({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items: readonly AppMenuItem[] = [
    ...useNavMenuItems(onClose),
    {
      key: '/importar',
      label: 'Importar CSV',
      icon: 'upload',
      dividerBefore: true,
      onSelect: () => {
        void navigate('/importar');
        onClose();
      },
    },
  ];
  return (
    <AppDrawer open={open} title="Menu" onClose={onClose} placement="left" size="sm">
      <nav aria-label="Menu completo">
        <AppMenu items={items} selectedKey={activeKey(pathname)} />
      </nav>
    </AppDrawer>
  );
}

interface ShellOverlaysProps {
  readonly isMenuOpen: boolean;
  readonly isPaletteOpen: boolean;
  readonly isShortcutsOpen: boolean;
  readonly onCloseMenu: () => void;
  readonly onClosePalette: () => void;
  readonly onCloseShortcuts: () => void;
  readonly onShowShortcuts: () => void;
}

/** Menu do celular, paleta de comandos e atalhos: carregam só quando alguém abre um deles. */
export default function ShellOverlays(props: ShellOverlaysProps) {
  return (
    <>
      <MobileNavDrawer open={props.isMenuOpen} onClose={props.onCloseMenu} />
      <CommandPalette
        open={props.isPaletteOpen}
        onClose={props.onClosePalette}
        onShowShortcuts={props.onShowShortcuts}
      />
      <ShortcutsModal open={props.isShortcutsOpen} onClose={props.onCloseShortcuts} />
    </>
  );
}
