import { Checkbox } from 'antd';
import type { ReactNode } from 'react';

interface AppCheckboxProps {
  readonly children?: ReactNode;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
  readonly indeterminate?: boolean;
  readonly onChange?: (checked: boolean) => void;
}

export function AppCheckbox({ onChange, ...props }: AppCheckboxProps) {
  return <Checkbox {...props} onChange={(event) => onChange?.(event.target.checked)} />;
}
