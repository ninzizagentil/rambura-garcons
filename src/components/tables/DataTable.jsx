import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingState } from '../feedback/States';
import { cn } from '../../utils/cn';

/**
 * DataTable — generic table renderer.
 * columns: [{ key, header, render?(row) }]
 */
export default function DataTable({ columns, data, loading, emptyState, rowKey = 'id', onRowClick }) {
  if (loading) return <LoadingState label="Loading records…" />;
  if (!data || data.length === 0) return emptyState || null;

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-gray)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="text-left font-semibold text-[var(--color-mid-gray)] uppercase tracking-wide text-xs px-4 py-3 whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-gray)]">
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-[var(--color-light-green-100)]'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-[var(--color-dark-gray)] whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-gray)]" aria-label="Pagination">
      <p className="text-xs text-[var(--color-mid-gray)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-md border border-[var(--color-border-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-md border border-[var(--color-border-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
