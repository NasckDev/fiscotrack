import { Table } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { useState, type Key, type ReactNode } from 'react';
import { AppEmpty } from './AppEmpty';
import { AppList } from './AppList';
import { AppPagination } from './AppPagination';
import { AppText } from './AppTypography';
import { useIsBelow } from './theme/AppThemeProvider';

export type AppTableColumn<T> = ColumnType<T>;

export interface AppTableProps<T> {
  readonly columns: readonly AppTableColumn<T>[];
  readonly data: readonly T[];
  readonly rowKey: (record: T) => Key;
  readonly loading?: boolean;
  /** Linhas por página; sem valor, mostra tudo. */
  readonly pageSize?: number;
  /** Texto do intervalo, por exemplo "1–50 de 120 operações". */
  readonly showTotal?: (total: number, range: readonly [number, number]) => string;
  /** Conteúdo quando não há linhas. */
  readonly empty?: ReactNode;
  /** No celular a tabela vira lista de cards: como desenhar cada item. */
  readonly renderCard?: (record: T) => ReactNode;
  readonly ariaLabel: string;
  readonly onRowClick?: (record: T) => void;
  readonly size?: 'sm' | 'md';
  /** Largura (px) abaixo da qual a tabela vira lista de cards; padrão 768 (celular). */
  readonly cardsBelow?: number;
}

/** Tabela com ordenação e filtros por coluna; no celular vira lista de cards (`renderCard`). */
export function AppTable<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  pageSize,
  showTotal,
  empty,
  renderCard,
  ariaLabel,
  onRowClick,
  size = 'md',
  cardsBelow = 768,
}: AppTableProps<T>) {
  const isMobile = useIsBelow(cardsBelow);
  const [page, setPage] = useState(1);
  const lastPage = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const current = Math.min(page, lastPage);

  const firstShown = pageSize === undefined ? 1 : (current - 1) * pageSize + 1;
  const lastShown =
    pageSize === undefined ? data.length : Math.min(current * pageSize, data.length);
  const totalText =
    showTotal === undefined ? null : (
      <div aria-live="polite" style={{ marginTop: 12 }}>
        <AppText type="secondary" size="sm">
          {showTotal?.(data.length, [firstShown, lastShown])}
        </AppText>
      </div>
    );

  if (data.length === 0 && !loading) {
    return <>{empty ?? <AppEmpty title="Nada por aqui" />}</>;
  }

  if (isMobile && renderCard) {
    const visible = pageSize ? data.slice((current - 1) * pageSize, current * pageSize) : data;
    return (
      <div>
        <AppList
          aria-label={ariaLabel}
          items={visible}
          itemKey={(record) => String(rowKey(record))}
          renderItem={renderCard}
        />
        {totalText}
        {pageSize !== undefined && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <AppPagination
              simple
              current={current}
              total={data.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Table<T>
        aria-label={ariaLabel}
        columns={[...columns]}
        dataSource={[...data]}
        rowKey={rowKey}
        loading={loading}
        size={size === 'sm' ? 'small' : 'middle'}
        scroll={{ x: 'max-content' }}
        pagination={
          pageSize
            ? {
                pageSize,
                current,
                onChange: setPage,
                showSizeChanger: false,
                hideOnSinglePage: true,
              }
            : false
        }
        onRow={
          onRowClick
            ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })
            : undefined
        }
      />
      {totalText}
    </div>
  );
}
