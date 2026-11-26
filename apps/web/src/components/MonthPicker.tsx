import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { formatMonthTitle } from '../domain/format';
import { useFinance } from '../state/useFinance';
import { AppDropdown, AppIcon, useAppColors, type AppMenuItem } from '../ui';

/** Mês mostrado no seletor: o pedido em `?mes=` na apuração ou, sem ele, o último apurado. */
export function selectedMonth(
  months: readonly string[],
  pathname: string,
  requested: string | null,
): string | null {
  if (months.length === 0) return null;
  if (pathname === '/apuracao' && requested !== null && months.includes(requested)) {
    return requested;
  }
  return months[months.length - 1] ?? null;
}

/** Seletor de mês da barra superior: abre a apuração já no mês escolhido. */
export function MonthPicker() {
  const { report } = useFinance();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const colors = useAppColors();
  const months = report.months.map((month) => month.month);
  const current = selectedMonth(months, pathname, params.get('mes'));
  if (current === null) return null;

  const items: readonly AppMenuItem[] = [...months].reverse().map((month) => ({
    key: month,
    label: formatMonthTitle(month),
    onSelect: () => void navigate(`/apuracao?mes=${month}`),
  }));
  const label = formatMonthTitle(current);

  return (
    <AppDropdown items={items} placement="bottomRight">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={`${label}: ver a apuração de outro mês`}
        style={{
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 999,
          border: `1.5px solid ${colors.borderSoft}`,
          background: 'transparent',
          color: colors.text,
          font: 'inherit',
          fontSize: 14,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <AppIcon name="chevron-down" size={11} />
      </button>
    </AppDropdown>
  );
}
