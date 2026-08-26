// Real, working "print" for report tables — opens a clean, formatted print
// window with the given columns/rows and triggers the browser's print
// dialog. Pure client-side, no backend required.

function printEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {string} title       Report title shown as the page heading
 * @param {{key: string, header: string}[]} columns
 * @param {object[]} rows
 */
export function printReport(title, columns, rows) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;

  const stamp = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const head = columns.map((c) => `<th>${printEscape(c.header)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td>${printEscape(typeof c.value === 'function' ? c.value(row) : row[c.key])}</td>`)
          .join('')}</tr>`
    )
    .join('');

  win.document.write(`
    <html>
      <head>
        <title>${printEscape(title)}</title>
        <style>
          body { font-family: -apple-system, Segoe UI, Arial, sans-serif; padding: 32px; color: #222; }
          h1 { font-size: 18px; margin-bottom: 2px; }
          p.meta { font-size: 12px; color: #666; margin-top: 0; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
          th { background: #f3f5f2; text-transform: uppercase; font-size: 10px; letter-spacing: 0.03em; }
          tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>${printEscape(title)}</h1>
        <p class="meta">Rambura Garçons — Generated ${printEscape(stamp)} · ${rows.length} record${rows.length === 1 ? '' : 's'}</p>
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body || '<tr><td colspan="' + columns.length + '">No records.</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
