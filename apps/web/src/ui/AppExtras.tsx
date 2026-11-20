import { Breadcrumb, Descriptions, Result, Segmented, Tabs } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AppIcon, type AppIconName } from './AppIcon';

/* ---------- Breadcrumb ---------- */

export interface AppBreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

export function AppBreadcrumb({ items }: { readonly items: readonly AppBreadcrumbItem[] }) {
  return (
    <Breadcrumb
      items={items.map((item) => ({
        title: item.to ? <Link to={item.to}>{item.label}</Link> : item.label,
      }))}
    />
  );
}

/* ---------- Tabs, Segmented ---------- */

export interface AppTabItem {
  readonly key: string;
  readonly label: ReactNode;
  readonly children: ReactNode;
}

export function AppTabs({
  items,
  defaultActiveKey,
}: {
  readonly items: readonly AppTabItem[];
  readonly defaultActiveKey?: string;
}) {
  return <Tabs defaultActiveKey={defaultActiveKey} items={items.map((item) => ({ ...item }))} />;
}

interface AppSegmentedProps<V extends string> {
  readonly options: readonly {
    readonly value: V;
    readonly label: ReactNode;
    readonly icon?: AppIconName;
    readonly ariaLabel?: string;
  }[];
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly 'aria-label': string;
}

export function AppSegmented<V extends string>({
  options,
  value,
  onChange,
  ...props
}: AppSegmentedProps<V>) {
  return (
    <Segmented<V>
      {...props}
      value={value}
      onChange={onChange}
      options={options.map((option) => ({
        value: option.value,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {option.icon && <AppIcon name={option.icon} />}
            {option.label}
          </span>
        ),
      }))}
    />
  );
}

/* ---------- Result e Descriptions ---------- */

interface AppResultProps {
  readonly status: 'success' | 'error' | 'warning' | 'info';
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}

export function AppResult({ status, title, description, actions }: AppResultProps) {
  return <Result status={status} title={title} subTitle={description} extra={actions} />;
}

export interface AppDescriptionItem {
  readonly label: string;
  readonly value: ReactNode;
}

export function AppDescriptions({
  items,
  columns = 2,
}: {
  readonly items: readonly AppDescriptionItem[];
  readonly columns?: number;
}) {
  return (
    <Descriptions
      column={{ xs: 1, sm: columns, md: columns }}
      items={items.map((item) => ({ key: item.label, label: item.label, children: item.value }))}
    />
  );
}
