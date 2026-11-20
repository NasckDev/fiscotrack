import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { MONO_STYLE } from './monoStyle';

const ISO = 'YYYY-MM-DD';

interface AppDatePickerProps {
  /** Data no formato AAAA-MM-DD. */
  readonly value?: string | null;
  readonly onChange?: (value: string | null) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly status?: 'error' | 'warning';
  /** Última data selecionável (AAAA-MM-DD). */
  readonly max?: string;
  readonly id?: string;
  readonly autoFocus?: boolean;
  readonly 'aria-label'?: string;
}

/** Seletor de data em português; entrega e recebe o texto AAAA-MM-DD. */
export function AppDatePicker({ value, onChange, max, ...props }: AppDatePickerProps) {
  const parsed = value ? dayjs(value, ISO, true) : null;
  return (
    <DatePicker
      {...props}
      value={parsed?.isValid() ? parsed : null}
      format="DD/MM/YYYY"
      allowClear
      disabledDate={max ? (date) => date.isAfter(dayjs(max, ISO), 'day') : undefined}
      onChange={(date) => onChange?.(date ? date.format(ISO) : null)}
      style={{ width: '100%', ...MONO_STYLE }}
    />
  );
}
