import { Switch } from 'antd';

interface AppSwitchProps {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly size?: 'sm' | 'md';
  readonly onChange?: (checked: boolean) => void;
  readonly 'aria-label': string;
}

export function AppSwitch({ size = 'md', ...props }: AppSwitchProps) {
  return <Switch {...props} size={size === 'sm' ? 'small' : 'default'} />;
}
