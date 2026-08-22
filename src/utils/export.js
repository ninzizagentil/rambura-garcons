// Real, working "export" for report/table data — generates an actual CSV
// file and triggers a browser download. No backend required; this is a
// pure client-side Blob download, ready to be swapped for a server-generated
// file later without changing any call sites (same exportToCSV(name, cols, rows) signature).

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * @param {string} filename  e.g. "library-reports" (no extension needed)
 * @param {{key: string, header: string}[]} columns
 * @param {object[]} rows
 */
export function exportToCSV(filename, columns, rows) {
  const header = columns.map((c) => csvEscape(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => csvEscape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
