import { useState } from 'react';
import { useNavigate } from 'react-router';
import { darfStatus, todayIso } from '../domain/darf';
import { formatMonth, plural } from '../domain/format';
import { useFinance } from '../state/useFinance';
import { AppBadge, AppButton, AppFlex, AppIconButton, AppPopover } from '../ui';

interface Notice {
  readonly id: string;
  readonly text: string;
  readonly to: string;
}

function useNotices(): readonly Notice[] {
  const { darfs, report } = useFinance();
  const today = todayIso();
  const notices: Notice[] = [];
  for (const entry of darfs) {
    const status = darfStatus(entry, today);
    if (status === 'overdue') {
      notices.push({
        id: `darf-${entry.month}`,
        text: `DARF de ${formatMonth(entry.month)} vencido. Pague e marque como pago.`,
        to: '/darfs',
      });
    } else if (status === 'due-soon') {
      notices.push({
        id: `darf-${entry.month}`,
        text: `DARF de ${formatMonth(entry.month)} vence em breve.`,
        to: '/darfs',
      });
    }
  }
  if (report.issues.length > 0) {
    notices.push({
      id: 'issues',
      text: `${plural(report.issues.length, 'operação ignorada', 'operações ignoradas')} no cálculo. Corrija para completar o resultado.`,
      to: '/operacoes',
    });
  }
  return notices;
}

/** Sino de avisos: DARFs vencidos ou perto do prazo e operações que o cálculo ignorou. */
export function Notifications() {
  const notices = useNotices();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const content = (
    <div style={{ width: 'min(320px, 80vw)' }}>
      {notices.length === 0 ? (
        <span>Nenhum aviso. Seus DARFs e operações estão em dia.</span>
      ) : (
        <AppFlex vertical gap="small" component="ul">
          {notices.map((notice) => (
            <li key={notice.id} style={{ listStyle: 'none' }}>
              <span style={{ display: 'block' }}>{notice.text}</span>
              <AppButton
                variant="link"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  void navigate(notice.to);
                }}
              >
                Ver detalhes
              </AppButton>
            </li>
          ))}
        </AppFlex>
      )}
    </div>
  );

  return (
    <AppPopover title="Avisos" content={content} open={open} onOpenChange={setOpen}>
      <span>
        <AppBadge count={notices.length}>
          <AppIconButton
            icon="bell"
            label={notices.length > 0 ? `Avisos (${notices.length})` : 'Avisos'}
            aria-haspopup="dialog"
          />
        </AppBadge>
      </span>
    </AppPopover>
  );
}
