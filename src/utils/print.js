const schoolLogo = new URL('../assets/brand/school-logo.png', import.meta.url).href;

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

function printValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return value.fullName || value.name || value.email || value.username || value.label || JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = value.slice(0, 10).split('-').map(Number);
    if (date.every(Number.isFinite)) return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(date[0], date[1] - 1, date[2])));
  }
  return value;
}

export function formatReportMonth(value) {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function buildMonthlyActivityPrintRows(data, valueKey) {
  return (data || []).map((entry) => ({
    month: formatReportMonth(entry.month),
    activity: entry[valueKey] ?? 0,
  }));
}

export function buildLibraryActivityPrintRows(libraryData) {
  return buildMonthlyActivityPrintRows(libraryData, 'loans');
}

export function buildStockActivityPrintRows(stockData) {
  return buildMonthlyActivityPrintRows(stockData, 'transactions');
}

export function buildEquipmentActivityPrintRows(equipmentData) {
  return buildMonthlyActivityPrintRows(equipmentData, 'registered');
}

export function buildAdminSummaryPrintRows(librarySummary, totalStockTransactions, equipmentSummary) {
  return [
    { metric: 'Total Books', value: librarySummary?.totalBooks || 0 },
    { metric: 'Borrowed Active Loans', value: librarySummary?.borrowedCopies || 0 },
    { metric: 'Overdue Loans', value: librarySummary?.overdueLoans || 0 },
    { metric: 'Transactions', value: totalStockTransactions || 0 },
    { metric: 'Equipment Registered', value: equipmentSummary?.totalEquipment || 0 },
    { metric: 'Under Maintenance', value: equipmentSummary?.underMaintenance || 0 },
  ];
}

/**
 * @param {string} title       Report title shown as the page heading
 * @param {{key: string, header: string}[]} columns
 * @param {object[]} rows
 */
export function printReport(title, columns, rows, meta = {}) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;

  const stamp = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const renderTable = (tableColumns, tableRows) => {
    const head = tableColumns.map((c) => `<th>${printEscape(c.header)}</th>`).join('');
    const body = tableRows
      .map((row) => `<tr>${tableColumns.map((c) => `<td>${printEscape(printValue(typeof c.value === 'function' ? c.value(row) : row[c.key]))}</td>`).join('')}</tr>`)
      .join('');
    return `<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td class="empty" colspan="${tableColumns.length}">No records available.</td></tr>`}</tbody></table>`;
  };
  const reportSections = meta.sections?.length
    ? meta.sections.map((section) => `<section class="report-section"><h2>${printEscape(section.title)}</h2>${renderTable(section.columns, section.data)}</section>`).join('')
    : renderTable(columns, rows);
  const summaryItems = (meta.summary || []).map(
    (item) => `<div class="summary-item"><span>${printEscape(item.label)}</span><strong>${printEscape(item.value)}</strong></div>`
  ).join('');
  win.document.write(`
    <html>
      <head>
        <title>${printEscape(title)}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm; }
          :root {
            --bg: #f7f8fb;
            --card: #ffffff;
            --border: #dfe7ee;
            --text: #1b2430;
            --muted: #536175;
            --primary: #1f8a5d;
            --soft: #edf9f3;
            --header-bg: #e9f5ee;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, Helvetica, sans-serif;
            color: var(--text);
            background: var(--bg);
          }
          .page {
            max-width: 100%;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 22px 20px 18px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
          }
          .institution {
            background: linear-gradient(135deg, #1f8a5d 0%, #2d9a7d 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
          }
          .logo-box {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
          }
          .logo-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .brand {
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.8);
            margin-bottom: 8px;
            font-weight: 700;
          }
          .school-name {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.02em;
            margin: 0;
          }
          .school-tag {
            font-size: 11px;
            margin-top: 6px;
            opacity: 0.9;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .address {
            font-size: 11px;
            margin-top: 8px;
            opacity: 0.92;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--header-bg);
            margin-bottom: 16px;
          }
          h1 {
            font-size: 24px;
            line-height: 1.2;
            margin: 0;
            color: #10213F;
          }
          .meta {
            font-size: 12px;
            color: var(--muted);
            margin: 0;
            text-align: right;
            white-space: nowrap;
          }
          .meta-strip {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 20px;
            margin: 12px 0 18px;
            padding: 10px 12px;
            background: #f7faf8;
            border: 1px solid #dfece4;
            border-radius: 10px;
            color: var(--muted);
            font-size: 11px;
          }
          .meta-strip strong {
            color: var(--text);
          }
          .badge {
            display: inline-block;
            background: var(--soft);
            color: var(--primary);
            border: 1px solid #cfe9dc;
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-top: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            table-layout: fixed;
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
          }
          .report-section {
            margin-top: 22px;
            break-inside: avoid;
          }
          .report-section h2 {
            color: var(--primary);
            font-size: 16px;
            margin: 0 0 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid var(--header-bg);
          }
          th, td {
            border: 1px solid var(--border);
            padding: 9px 10px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
          }
          th {
            background: var(--header-bg);
            color: #10213F;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 9px;
            font-weight: 700;
          }
          tr:nth-child(even) td {
            background: #fafcfb;
          }
          .empty {
            text-align: center;
            color: var(--muted);
            padding: 18px;
            font-style: italic;
            background: #f9fafb;
          }
          .footer {
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
            font-size: 10px;
            color: var(--muted);
            text-align: right;
          }
          .summary-box {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin: 0 0 18px;
          }
          .summary-item {
            background: var(--soft);
            border: 1px solid #d4ebdd;
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            font-size: 11px;
            color: var(--muted);
          }
          .summary-item strong {
            color: var(--text);
            font-size: 13px;
          }
          .signoff {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-top: 28px;
            border-top: 1px solid var(--border);
            padding-top: 14px;
            font-size: 10px;
            color: var(--muted);
          }
          .signoff-box {
            width: 180px;
            border-top: 2px solid var(--header-bg);
            padding-top: 8px;
          }
          .signature-line {
            border-top: 1px solid var(--border);
            margin-top: 12px;
            padding-top: 6px;
            min-height: 36px;
            width: 100%;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .page {
              border: none;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="institution">
            <div class="logo-box"><img src="${schoolLogo}" alt="Rambura Garçons logo" /></div>
            <div>
              <div class="brand">Rambura Garçons</div>
              <h2 class="school-name">Rambura Garçons School</h2>
              <div class="school-tag">Operations & Administration Report</div>
              <div class="address">P.O. Box 123 • Kigali, Rwanda • admin@ramburagarcons.rw</div>
            </div>
          </div>
          <div class="header-row">
            <div>
              <h1>${printEscape(title)}</h1>
              <div class="badge">${rows.length} record${rows.length === 1 ? '' : 's'}</div>
            </div>
            <p class="meta">Generated ${printEscape(stamp)}</p>
          </div>
          <div class="meta-strip">
            ${meta.generatedBy ? `<div><strong>Generated by:</strong> ${printEscape(meta.generatedBy)}</div>` : ''}
            ${meta.reportPeriod ? `<div><strong>Period:</strong> ${printEscape(meta.reportPeriod)}</div>` : ''}
            ${meta.reportCode ? `<div><strong>Report ID:</strong> ${printEscape(meta.reportCode)}</div>` : ''}
          </div>
          ${summaryItems ? `<div class="summary-box">${summaryItems}</div>` : ''}
          ${reportSections}
          <div class="footer">Printed by Rambura Garçons • ${printEscape(stamp)}</div>
          <div class="signoff">
            <div class="signoff-box">
              <div>Prepared by</div>
              <div class="signature-line"></div>
              <strong>Administration Office</strong>
            </div>
            <div class="signoff-box">
              <div>Approved by</div>
              <div class="signature-line"></div>
              <strong>School Management</strong>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
