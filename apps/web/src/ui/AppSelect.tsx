import { Select } from 'antd';

export interface AppSelectOption<V extends string | number = string> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}

interface AppSelectProps<V extends string | number> {
  readonly options: readonly AppSelectOption<V>[];
  readonly value?: V | null;
  readonly defaultValue?: V;
  readonly onChange?: (value: V) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly status?: 'error' | 'warning';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly allowClear?: boolean;
  readonly showSearch?: boolean;
  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly fullWidth?: boolean;
}

const SIZES = { sm: 'small', md: 'middle', lg: 'large' } as const;

export function AppSelect<V extends string | number = string>({
  size = 'md',
  options,
  value,
  fullWidth = true,
  ...props
}: AppSelectProps<V>) {
  return (
    <Select<V>
      {...props}
      value={value ?? undefined}
      size={SIZES[size]}
      options={options.map((option) => ({ ...option }))}
      style={fullWidth ? { width: '100%' } : undefined}
      optionFilterProp="label"
    />
  );
}
