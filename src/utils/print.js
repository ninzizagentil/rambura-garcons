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
          @page { size: A4 portrait; margin: 18mm; }
          body {
            margin: 0;
            padding: 28px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            background: #ffffff;
          }
          .page {
            max-width: 100%;
          }
          .brand {
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #2C6754;
            margin-bottom: 6px;
            font-weight: 700;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 6px;
            color: #0E2B27;
          }
          .meta {
            font-size: 12px;
            color: #52656d;
            margin: 0 0 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #dfe8e2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d7dfd9;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
          }
          th {
            background: #edf4f0;
            color: #153A2F;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 9px;
          }
          tr:nth-child(even) td {
            background: #fafcfb;
          }
          .empty {
            text-align: center;
            color: #667085;
            padding: 18px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="brand">Rambura Garçons</div>
          <h1>${printEscape(title)}</h1>
          <p class="meta">Generated ${printEscape(stamp)} · ${rows.length} record${rows.length === 1 ? '' : 's'}</p>
          <table>
            <thead><tr>${head}</tr></thead>
            <tbody>${body || '<tr><td class="empty" colspan="' + columns.length + '">No records available.</td></tr>'}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
