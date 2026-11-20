import { Link } from 'react-router';
import { MENU_ITEMS } from '../navigation';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

const ITEMS: readonly { to: string; label: string; hint: string; icon: IconName }[] = [
  { to: '/importar', label: 'Importar CSV', hint: 'Traga operações da corretora', icon: 'upload' },
  ...MENU_ITEMS.map((item) => ({
    to: item.to,
    label: item.label,
    hint: item.to === '/regras' ? 'Premissas e fontes legais' : 'Tema, backup e privacidade',
    icon: item.icon,
  })),
];

/** Menu do header no celular: o que não cabe na barra inferior. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Menu" onClose={onClose} size="sm" placement="top">
      <ul className="-my-2 divide-y divide-line-soft">
        {ITEMS.map((item, index) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClose}
              data-autofocus={index === 0 ? true : undefined}
              className="flex min-h-14 items-center gap-3 py-2"
            >
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-accent-surface text-accent">
                <Icon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{item.label}</span>
                <span className="block text-sm text-muted">{item.hint}</span>
              </span>
              <Icon name="chevron-right" size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
