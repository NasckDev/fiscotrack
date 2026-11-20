import { Collapse } from 'antd';
import type { ReactNode } from 'react';

export interface AppCollapseItem {
  readonly key: string;
  readonly label: ReactNode;
  readonly children: ReactNode;
}

interface AppCollapseProps {
  readonly items: readonly AppCollapseItem[];
  readonly defaultActiveKey?: readonly string[];
  readonly ghost?: boolean;
  readonly onChange?: (keys: readonly string[]) => void;
}

/** Seções recolhíveis (por exemplo, "Por que deu esse valor?"). */
export function AppCollapse({
  items,
  ghost = false,
  defaultActiveKey,
  onChange,
}: AppCollapseProps) {
  return (
    <Collapse
      ghost={ghost}
      defaultActiveKey={defaultActiveKey ? [...defaultActiveKey] : undefined}
      onChange={(keys) => onChange?.(Array.isArray(keys) ? keys.map(String) : [String(keys)])}
      items={items.map((item) => ({ ...item }))}
    />
  );
}
