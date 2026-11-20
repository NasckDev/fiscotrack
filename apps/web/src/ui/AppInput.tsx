import { Input } from 'antd';
import type { ChangeEventHandler, KeyboardEventHandler, ReactNode } from 'react';
import { AppIcon } from './AppIcon';
import { MONO_STYLE } from './monoStyle';

export interface AppInputProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly status?: 'error' | 'warning';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
  readonly allowClear?: boolean;
  /** Valores numéricos: fonte mono tabular. */
  readonly mono?: boolean;
  readonly inputMode?: 'text' | 'numeric' | 'decimal' | 'search';
  readonly autoFocus?: boolean;
  readonly autoCapitalize?: string;
  readonly spellCheck?: boolean;
  readonly id?: string;
  readonly name?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-controls'?: string;
  readonly 'aria-activedescendant'?: string;
  readonly role?: string;
  readonly onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

const SIZES = { sm: 'small', md: 'middle', lg: 'large' } as const;

export function AppInput({ size = 'md', mono = false, ...props }: AppInputProps) {
  return <Input {...props} size={SIZES[size]} style={mono ? MONO_STYLE : undefined} />;
}

/** Campo de busca com ícone e botão de limpar. */
export function AppSearchInput({
  size = 'md',
  ...props
}: Omit<AppInputProps, 'prefix' | 'suffix' | 'allowClear' | 'inputMode'>) {
  return (
    <Input
      {...props}
      type="search"
      inputMode="search"
      size={SIZES[size]}
      allowClear
      prefix={<AppIcon name="search" />}
    />
  );
}
