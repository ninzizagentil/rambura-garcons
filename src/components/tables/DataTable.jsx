import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { LoadingState } from '../feedback/States';
import { cn } from '../../utils/cn';
import { useApp } from '../../context/AppContext';

/**
 * DataTable — generic table renderer.
 * columns: [{ key, header, render?(row), sortable?: boolean }]
 *
 * Selection and sorting are both opt-in and fully backward compatible:
 * existing call sites that don't pass these props render exactly as before.
 *   - selectable: pass selectedKeys (Set), onToggleRow(row), onToggleAll() to add a checkbox column.
 *   - sorting: pass sortKey, sortDir ('asc'|'desc'), onSort(key) — columns need sortable: true.
 */
export default function DataTable({
  columns,
  data,
  loading,
  emptyState,
  rowKey = 'id',
  onRowClick,
  selectable = false,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  sortKey,
  sortDir,
  onSort,
}) {
  const { t } = useApp();
  if (loading) return <LoadingState label={t('loadingRecords')} />;
  if (!data || data.length === 0) return emptyState || null;

  const allSelected = selectable && data.length > 0 && data.every((row) => selectedKeys?.has(row[rowKey]));
  const someSelected = selectable && !allSelected && data.some((row) => selectedKeys?.has(row[rowKey]));

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-gray)] bg-gradient-to-r from-[rgba(217,164,65,0.01)] to-transparent">
            {selectable && (
              <th scope="col" className="px-5 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={onToggleAll}
                  aria-label={t('selectAllRows')}
                  className="w-4 h-4 rounded border-[var(--color-border-gray)] accent-[var(--color-medium-green)] cursor-pointer"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="text-left font-bold text-[var(--color-dark-gray)] uppercase tracking-[0.14em] text-[10px] px-5 py-4 whitespace-nowrap"
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-[var(--color-medium-green)] transition-colors"
                  >
                    {col.header}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-gray)]">
          {data.map((row) => {
            const checked = selectable && !!selectedKeys?.has(row[rowKey]);
            return (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-all duration-200',
                  onRowClick && 'cursor-pointer hover:bg-[var(--color-soft-gray)]',
                  checked && 'bg-[var(--color-light-green-100)]'
                )}
              >
                {selectable && (
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRow?.(row)}
                      aria-label={t('selectRow', { row: row[rowKey] })}
                      className="w-4 h-4 rounded border-[var(--color-border-gray)] accent-[var(--color-medium-green)] cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-[var(--color-dark-gray)] font-medium">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * TablePagination — numbered pagination with a page-size selector and a
 * "Showing X to Y of Z" summary. A separate export from Pagination above
 * (which BorrowingHistory.jsx already depends on with a simpler prev/next
 * signature) so neither call site needs to change.
 */
export function TablePagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50] }) {
  const { t } = useApp();
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pageNumbers = () => {
    const pages = [];
    const add = (n) => pages.push(n);
    const addEllipsis = () => pages.push('…');
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i);
    } else {
      add(1);
      if (page > 3) addEllipsis();
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
      if (page < totalPages - 2) addEllipsis();
      add(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-t border-[var(--color-border-gray)] bg-gradient-to-r from-[rgba(217,164,65,0.01)] to-transparent"
      aria-label={t('pagination')}
    >
      <p className="text-xs font-medium text-[var(--color-mid-gray)] order-2 sm:order-1">
        {t('showingItems', { from, to, total: totalItems })}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap order-1 sm:order-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[var(--color-border-gray)] text-xs font-medium text-[var(--color-dark-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)] disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          {t('previous')}
        </button>

        {pageNumbers().map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1.5 text-xs text-[var(--color-mid-gray)]">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                'min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-colors',
                n === page
                  ? 'bg-[var(--color-medium-green)] text-white'
                  : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)]'
              )}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[var(--color-border-gray)] text-xs font-medium text-[var(--color-dark-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)] disabled:hover:bg-transparent"
        >
          {t('next')}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {onPageSizeChange && (
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-mid-gray)] order-3">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={t('itemsPerPage')}
            className="rounded-md border border-[var(--color-border-gray)] bg-[var(--color-white)] px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{t('perPage', { count: n })}</option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useApp();
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-gray)]" aria-label={t('pagination')}>
      <p className="text-xs text-[var(--color-mid-gray)]">
        {t('pageOf', { page, total: totalPages })}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('previousPage')}
          className="p-1.5 rounded-md border border-[var(--color-border-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('nextPage')}
          className="p-1.5 rounded-md border border-[var(--color-border-gray)] disabled:opacity-40 hover:bg-[var(--color-soft-gray)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
