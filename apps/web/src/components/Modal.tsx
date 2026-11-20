import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** Largura máxima do painel. */
  readonly size?: 'sm' | 'md' | 'lg';
  /** Alinha o painel ao topo (paleta de comandos). */
  readonly placement?: 'center' | 'top';
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl' } as const;

/**
 * Diálogo modal sobre o elemento nativo `<dialog>`: o navegador prende o foco, fecha com Esc
 * e devolve o foco a quem abriu.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
  placement = 'center',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // O navegador foca o primeiro item (Fechar); levamos o foco ao campo certo.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`modal m-auto w-[calc(100%-1.5rem)] ${SIZES[size]} rounded-2xl border border-line-soft bg-card p-0 text-ink shadow-lg ${
        placement === 'top' ? 'mt-[12vh]' : ''
      }`}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto">
          <header className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
              <Icon name="x" />
            </button>
          </header>
          <div className="p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
