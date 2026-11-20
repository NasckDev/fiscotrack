import { Pagination } from 'antd';

interface AppPaginationProps {
  readonly current: number;
  readonly total: number;
  readonly pageSize: number;
  readonly onChange: (page: number) => void;
  /** Texto do intervalo, por exemplo "1–50 de 120 operações". */
  readonly showTotal?: (total: number, range: readonly [number, number]) => string;
  readonly simple?: boolean;
}

export function AppPagination({ onChange, showTotal, ...props }: AppPaginationProps) {
  if (props.total <= props.pageSize && showTotal === undefined) return null;
  return (
    <Pagination
      {...props}
      showSizeChanger={false}
      hideOnSinglePage={false}
      showTotal={showTotal ? (total, range) => showTotal(total, range) : undefined}
      onChange={onChange}
    />
  );
}
