export function sortActivityEntries(entries, sortKey = 'date', sortDir = 'desc') {
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...entries].sort((a, b) => {
    const leftValue = sortKey === 'date' ? new Date(a?.[sortKey] ?? 0).getTime() : (a?.[sortKey] ?? '');
    const rightValue = sortKey === 'date' ? new Date(b?.[sortKey] ?? 0).getTime() : (b?.[sortKey] ?? '');

    const leftComparable = sortKey === 'date' ? leftValue : String(leftValue).toLowerCase();
    const rightComparable = sortKey === 'date' ? rightValue : String(rightValue).toLowerCase();

    if (leftComparable < rightComparable) return -1 * direction;
    if (leftComparable > rightComparable) return 1 * direction;
    return 0;
  });
}

export function matchesActivityDateRange(entry, dateFrom = '', dateTo = '') {
  if (!dateFrom && !dateTo) return true;

  const entryDate = new Date(entry?.date ?? 0).getTime();
  const start = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const end = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

  if (start !== null && entryDate < start) return false;
  if (end !== null && entryDate > end) return false;
  return true;
}
