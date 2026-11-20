import { SHORTCUTS } from '../navigation';
import { AppModal, AppText, useAppColors } from '../ui';

export function ShortcutsModal({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const colors = useAppColors();
  return (
    <AppModal open={open} title="Atalhos de teclado" onClose={onClose} size="sm">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '10px 0',
              borderBottom: `1px solid ${colors.borderSoft}`,
            }}
          >
            <span>{shortcut.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
              {shortcut.keys.map((key, index) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {index > 0 && (
                    <AppText type="secondary" size="sm">
                      depois
                    </AppText>
                  )}
                  <kbd
                    style={{
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.bgSubtle,
                    }}
                  >
                    {key}
                  </kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </AppModal>
  );
}
