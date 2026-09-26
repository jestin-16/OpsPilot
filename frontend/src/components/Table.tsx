import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table<T>({ data, columns, keyExtractor, onRowClick, className = '', emptyMessage = 'No data available' }: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-op-border bg-op-surface ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-op-raised border-b border-op-border">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 text-sm font-semibold text-op-fg whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-op-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-op-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-op-raised/50' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-op-fg whitespace-nowrap">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
