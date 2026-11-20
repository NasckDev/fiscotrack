import { SHORTCUTS } from '../navigation';
import { Modal } from './Modal';

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Atalhos de teclado" onClose={onClose} size="sm">
      <ul className="divide-y divide-line-soft">
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.label}
            className="flex items-center justify-between gap-4 py-2.5 text-sm"
          >
            <span>{shortcut.label}</span>
            <span className="flex flex-none items-center gap-1">
              {shortcut.keys.map((key, index) => (
                <span key={key} className="flex items-center gap-1">
                  {index > 0 && <span className="text-xs text-muted">depois</span>}
                  <kbd className="kbd">{key}</kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
