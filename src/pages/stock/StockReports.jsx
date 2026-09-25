import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download, Printer, Eye, FileBarChart,
  BarChart3, Scale, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  getItems, getTransactions, getLowStockItems, getOutOfStockItems, getDamagedItems,
  getRemovedItems, getUsageByItem, getTotalStockValue, getStockValueByCategory,
  useStockVersion, refreshStock,
} from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const PIE_COLORS   = ['var(--color-medium-green)', 'var(--color-status-blue)', 'var(--color-gold)'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TABS = [
  { id: 'overview',  label: 'overview'          },
  { id: 'analytics', label: 'usageAnalytics'    },
  { id: 'abc',       label: 'abcClassification' },
];

function formatRWF(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString('en-US')}`;
}

function buildMonthlyTrend(transactions, category) {
  const rows = category ? transactions.filter((t) => t.category === category) : transactions;
  const byMonth = {};
  rows.forEach((t) => {
    const key = t.date?.slice(0, 7);
    if (!key) return;
    if (!byMonth[key]) byMonth[key] = { in: 0, out: 0, adjustment: 0, removed: 0 };
    if      (t.type === 'in')         byMonth[key].in          += t.quantity;
    else if (t.type === 'out')        byMonth[key].out         += t.quantity;
    else if (t.type === 'adjustment') byMonth[key].adjustment  += 1;
    else if (t.type === 'removed')    byMonth[key].removed     += t.quantity;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ month: MONTH_LABELS[Number(key.slice(5, 7)) - 1], ...vals }));
}

export default function StockReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.find((tb) => tb.id === searchParams.get('tab'))?.id ?? 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useApp();
  // Reports must reflect the latest server data, not just what was cached at login.
  useEffect(() => { refreshStock().catch(() => {}); }, []);

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('stockReports')}
        description={`${t('stockReports')} — ${t('usageAnalytics')} — ${t('abcClassification')}`}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('reports') }]}
      />

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border-gray)] pb-0">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              role="tab"
              aria-selected={isActive}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-[var(--color-medium-green)] text-[var(--color-medium-green)] bg-[var(--color-white)]'
                  : 'border-transparent text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]',
              ].join(' ')}
            >
              {t(label)}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview'  && <OverviewTab  t={t} />}
      {activeTab === 'analytics' && <AnalyticsTab t={t} />}
      {activeTab === 'abc'       && <ABCTab />}
    </div>
  );
}

function OverviewTab({ t }) {
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const [category, setCategory] = useState('');
  const stockVersion = useStockVersion();

  const items        = useMemo(() => { void stockVersion; return getItems(); }, [stockVersion]);
  const transactions = useMemo(() => { void stockVersion; return getTransactions(); }, [stockVersion]);
  const lowStock     = useMemo(() => { void stockVersion; return getLowStockItems(); }, [stockVersion]);
  const outOfStock   = useMemo(() => { void stockVersion; return getOutOfStockItems(); }, [stockVersion]);
  const damaged      = useMemo(() => { void stockVersion; return getDamagedItems(); }, [stockVersion]);
  const removed      = useMemo(() => { void stockVersion; return getRemovedItems(); }, [stockVersion]);
  const usage        = useMemo(() => { void stockVersion; return getUsageByItem(); }, [stockVersion]);
  const totalValue   = useMemo(() => { void stockVersion; return getTotalStockValue(); }, [stockVersion]);
  const expiring     = useMemo(() => items.filter((i) => !!i.expiryDate), [items]);

  const filteredItems = category ? items.filter((i) => i.category === category) : items;
  const filteredTx    = category ? transactions.filter((tx) => tx.category === category) : transactions;

  const received = filteredTx.filter((tx) => tx.type === 'in').reduce((s, tx) => s + tx.quantity, 0);
  const issued   = filteredTx.filter((tx) => tx.type === 'out').reduce((s, tx) => s + tx.quantity, 0);

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.quantity;
    return acc;
  }, {});
  const categoryBalanceData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const mostUsed = usage
    .filter((i) => (!category || i.category === category) && i.used > 0)
    .slice(0, 5);

  const movementSummary = STOCK_CATEGORIES.map((cat) => {
    const rows = transactions.filter((tx) => tx.category === cat);
    return {
      category:   cat,
      in:         rows.filter((tx) => tx.type === 'in').reduce((s, tx) => s + tx.quantity, 0),
      out:        rows.filter((tx) => tx.type === 'out').reduce((s, tx) => s + tx.quantity, 0),
      adjustment: rows.filter((tx) => tx.type === 'adjustment').length,
      transfer:   rows.filter((tx) => tx.type === 'transfer').reduce((s, tx) => s + tx.quantity, 0),
      removed:    rows.filter((tx) => tx.type === 'removed').reduce((s, tx) => s + tx.quantity, 0),
    };
  });

  const REPORTS = [
    {
      id: 'inventory', title: t('inventory'),
      description: t('manageStockCatalogue'),
      data: filteredItems,
      columns: [
        { key: 'code', header: t('code') }, { key: 'name', header: t('itemName') },
        { key: 'category', header: t('category') }, { key: 'unit', header: t('unit') },
        { key: 'quantity', header: t('quantity') }, { key: 'minLevel', header: t('minimumLevel') },
        { key: 'location', header: t('location') }, { key: 'status', header: t('status') },
      ],
      viewTo: '/stock/items',
    },
    {
      id: 'movement', title: t('stockTransactions'),
      description: t('stockTransactionsDescription'),
      data: movementSummary,
      columns: [
        { key: 'category', header: t('category') }, { key: 'in', header: t('stockIn') },
        { key: 'out', header: t('stockOut') }, { key: 'adjustment', header: t('adjust') },
        { key: 'transfer', header: t('transferStock') }, { key: 'removed', header: t('remove') },
      ],
      viewTo: '/stock/transactions',
    },
    {
      id: 'low-stock', title: t('lowStock'),
      description: t('lowStockDescription'),
      data: lowStock,
      columns: [
        { key: 'name', header: t('item') }, { key: 'category', header: t('category') },
        { key: 'quantity', header: t('currentQuantity') }, { key: 'minLevel', header: t('minimumLevel') },
        { header: t('difference'), value: (i) => i.quantity - i.minLevel },
      ],
      viewTo: '/stock/alerts?tab=low-stock',
    },
    {
      id: 'out-of-stock', title: t('outOfStock'),
      description: t('outOfStockDescription'),
      data: outOfStock,
      columns: [
        { key: 'name', header: t('item') }, { key: 'category', header: t('category') },
        { key: 'minLevel', header: t('minimumLevel') }, { key: 'supplier', header: t('supplier') },
        { key: 'location', header: t('location') },
      ],
      viewTo: '/stock/alerts?tab=out-of-stock',
    },
    {
      id: 'damaged', title: t('damagedItems'),
      description: t('damagedItemsDescription'),
      data: damaged,
      columns: [
        { key: 'itemName', header: t('item') }, { key: 'quantity', header: t('quantity') },
        { key: 'reason', header: t('reason') }, { key: 'date', header: t('date') },
        { key: 'reportedBy', header: t('reportedBy') }, { key: 'status', header: t('status') },
      ],
      viewTo: '/stock/activity?tab=damaged',
    },
    {
      id: 'expired', title: t('expiredItems'),
      description: t('expiryManagementDescription'),
      data: expiring,
      columns: [
        { key: 'name', header: t('item') }, { key: 'batchNumber', header: t('batchLot') },
        { key: 'expiryDate', header: t('expiryDate') }, { key: 'quantity', header: t('quantity') },
        { key: 'expiryDaysRemaining', header: t('daysRemaining') },
        { key: 'expiryStatus', header: t('status') },
      ],
      viewTo: '/stock/alerts?tab=expiring',
    },
    {
      id: 'removed', title: t('removedDisposed'),
      description: t('removedDisposedDescription'),
      data: removed,
      columns: [
        { key: 'itemName', header: 'Item' },
        { key: 'quantityRemoved', header: 'Quantity Removed' },
        { key: 'remainingQuantity', header: 'Remaining Quantity' },
        { key: 'reason', header: 'Reason' }, { key: 'date', header: 'Date' },
        { key: 'responsibleUser', header: 'Responsible User' },
        { key: 'approvedBy', header: 'Approved By' },
      ],
      viewTo: '/stock/activity?tab=disposed',
    },
    {
      id: 'valuation', title: t('totalValue'),
      description: t('managementStockReportsDescription'),
      data: filteredItems,
      columns: [
        { key: 'name', header: 'Item' }, { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Quantity' },
        { header: 'Unit Price (RWF)', value: (i) => i.unitPrice || 0 },
        { header: 'Total Value (RWF)', value: (i) => Math.round(i.value || 0) },
      ],
      viewTo: '/stock/items',
    },
    {
      id: 'transactions', title: t('transactions'),
      description: t('stockTransactionsAuditDescription'),
      data: filteredTx,
      columns: [
        { key: 'date', header: 'Date' }, { key: 'itemName', header: 'Item' },
        { key: 'type', header: 'Type' }, { key: 'quantity', header: 'Quantity' },
        { key: 'responsibleUser', header: 'Responsible User' },
        { key: 'party', header: 'Source / Destination' },
      ],
      viewTo: '/stock/transactions',
    },
  ];

  const handleExport = (report) => {
    exportToCSV(`stock-${report.id}`, report.columns, report.data);
    showToast(t('stockReportDownloaded'), 'success');
  };
  const handlePrint = (report) => {
    const ok = printReport(report.title, report.columns, report.data);
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };
  const handlePrintAll = () => {
    const ok = printReport(t('stockReports'), [], [], {
      sections: REPORTS.map((report) => ({
        title: report.title,
        columns: report.columns,
        data: report.data,
      })),
    });
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown
          label={t('allCategories')}
          value={category}
          onChange={setCategory}
          options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}
        />
        <Button variant="secondary" icon={Printer} onClick={handlePrintAll}>
          {t('printAll')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('receivedStock')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-green)] mt-1">+{received}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('issuedUsedStock')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-amber)] mt-1">−{issued}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('totalStockValue')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{formatRWF(totalValue)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title={t('currentBalancesCategory')} description={t('stockCategoriesDescription')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryBalanceData} dataKey="value" nameKey="name" outerRadius={85} label>
                {categoryBalanceData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('mostUsedItems')} description={t('mostUsedItemsDescription')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mostUsed}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="name" stroke="var(--color-mid-gray)" fontSize={11}
                interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="used" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <h2 className="font-display text-base font-semibold text-[var(--color-heading)] mb-3">
        {t('allReports')}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] flex-shrink-0">
                <FileBarChart className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display font-semibold text-[var(--color-dark-gray)]">{report.title}</p>
                <p className="text-xs text-[var(--color-mid-gray)] mt-0.5">
                  {report.data.length} record{report.data.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-mid-gray)] mb-4 flex-1">{report.description}</p>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" icon={Eye} onClick={() => navigate(report.viewTo)}>
                {t('view')}
              </Button>
              <Button size="sm" variant="secondary" icon={Printer} onClick={() => handlePrint(report)}>
                {t('print')}
              </Button>
              <IconButton icon={Download} label={`Export ${report.title} as CSV`} onClick={() => handleExport(report)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ t }) {
  const [category, setCategory]     = useState('');
  const stockVersion    = useStockVersion();
  const usage           = useMemo(() => { void stockVersion; return getUsageByItem(); }, [stockVersion]);
  const transactions    = useMemo(() => { void stockVersion; return getTransactions(); }, [stockVersion]);
  const valueByCategory = useMemo(() => { void stockVersion; return getStockValueByCategory(); }, [stockVersion]);

  const filteredUsage = useMemo(
    () => (category ? usage.filter((i) => i.category === category) : usage),
    [usage, category],
  );

  const fastMoving = filteredUsage.filter((i) => i.used > 0).slice(0, 6);
  const slowMoving = [...filteredUsage].sort((a, b) => a.used - b.used).slice(0, 6);
  const trendData  = useMemo(() => buildMonthlyTrend(transactions, category), [transactions, category]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown
          label={t('allCategories')}
          value={category}
          onChange={setCategory}
          options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title={t('fastMovingItems')} description={t('fastMovingDescription')}>
          {fastMoving.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)] py-6 text-center">
              {t('noStockOutActivity')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fastMoving} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
                <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
                <Tooltip />
                <Bar dataKey="used" name="Used" fill="var(--color-medium-green)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('slowMovingItems')} description={t('slowMovingDescription')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={slowMoving} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
              <Tooltip />
              <Bar dataKey="used" name="Used" fill="var(--color-gold)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title={t('stockMovementTrends')} description={t('stockMovementDescription')} className="mb-5">
        {trendData.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)] py-6 text-center">
            {t('noTransactionHistoryFilter')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="in"         name="Stock In"    stroke="var(--color-medium-green)" strokeWidth={2} />
              <Line type="monotone" dataKey="out"        name="Stock Out"   stroke="var(--color-status-amber)" strokeWidth={2} />
              <Line type="monotone" dataKey="adjustment" name="Adjustments" stroke="var(--color-status-blue)"  strokeWidth={2} />
              <Line type="monotone" dataKey="removed"    name="Removed"     stroke="var(--color-status-red)"   strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t('stockValueByCategory')} description={t('stockValueCategoryDescription')}>
        <div className="grid sm:grid-cols-2 gap-4">
          {valueByCategory.map((c) => (
            <div key={c.category} className="rounded-[var(--radius-control)] bg-[var(--color-off-white)] p-4">
              <p className="text-sm text-[var(--color-mid-gray)]">
                {c.category} — {c.count} item{c.count === 1 ? '' : 's'}
              </p>
              <p className="font-display text-xl font-semibold text-[var(--color-dark-gray)] mt-1">
                RWF {Math.round(c.value).toLocaleString('en-US')}
              </p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ABCTab() {
  const { showToast }     = useToast();
  const { t }             = useApp();
  const [report, setReport]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [selectedClass, setSelectedClass] = useState('A');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const json = await api.get('/stock/reports/abc-classification');
        if (!cancelled) setReport(json.data);
      } catch (err) {
        if (!cancelled) showToast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToast, t]);

  const refreshReport = () => {
    setLoading(true);
    api.get('/stock/reports/abc-classification')
      .then((json) => setReport(json.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="py-16 text-center text-sm text-[var(--color-mid-gray)]">
      Loading ABC Classification…
    </div>
  );
  if (!report)  return (
    <div className="py-16 text-center text-sm text-[var(--color-status-red)]">
      Failed to load report. Please try again.
    </div>
  );

  const currentClass = report.classifications[selectedClass];
  const filteredItems = currentClass.items.filter((item) => (
    (!categoryFilter || item.category === categoryFilter) &&
    (!locationFilter || item.location === locationFilter)
  ));
  const allClassItems = ['A', 'B', 'C'].flatMap((className) => report.classifications[className].items.map((item) => ({ ...item, className })));
  const highestValueItems = [...allClassItems].sort((a, b) => b.value - a.value).slice(0, 5);
  const attentionItems = allClassItems.filter((item) => item.className === 'A' && item.quantity <= item.minLevel).slice(0, 5);
  const exportCurrentClass = () => {
    exportToCSV(`abc-class-${selectedClass.toLowerCase()}`, [
      { key: 'code', header: t('code') },
      { key: 'name', header: t('itemName') },
      { key: 'category', header: t('category') },
      { key: 'quantity', header: t('quantity') },
      { key: 'value', header: t('valueRwf') },
      { key: 'location', header: t('location') },
    ], filteredItems);
    showToast(`Class ${selectedClass} exported.`, 'success');
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-mid-gray)]">
        {t('abcAnalysisDescription')}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalItems'), value: report.summary.totalItems, color: 'var(--color-dark-gray)',   bg: 'var(--color-off-white)' },
          { label: t('classA'),     value: report.classifications.A.count, sub: `${report.classifications.A.percentage}% ${t('ofValue')}`, color: '#10b981', bg: '#ecfdf5' },
          { label: t('classB'),     value: report.classifications.B.count, sub: `${report.classifications.B.percentage}% ${t('ofValue')}`, color: '#f59e0b', bg: '#fffbeb' },
          { label: t('classC'),     value: report.classifications.C.count, sub: `${report.classifications.C.percentage}% ${t('ofValue')}`, color: '#ef4444', bg: '#fef2f2' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5"
            style={{ background: bg }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</p>
            <p className="font-display text-3xl font-bold mt-2" style={{ color }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4">
        <FilterDropdown
          label={t('allCategories')}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={STOCK_CATEGORIES.map((category) => ({ value: category, label: t(`stockCategory.${category}`) }))}
        />
        <FilterDropdown
          label={t('allLocations')}
          value={locationFilter}
          onChange={setLocationFilter}
          options={['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'].map((location) => ({ value: location, label: t(`stockLocation.${location}`) }))}
        />
        <Button variant="secondary" icon={Download} onClick={exportCurrentClass}>
          {t('exportCsv')}
        </Button>
        <Button variant="ghost" onClick={refreshReport} loading={loading}>
          {t('refresh')}
        </Button>
        <span className="ml-auto text-xs text-[var(--color-mid-gray)]">
          {t('lastCalculated')}: {report.summary.lastCalculated ? new Date(report.summary.lastCalculated).toLocaleString() : '—'}
        </span>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-medium-green)]/30 bg-[var(--color-light-green-100)] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-medium-green)]">{t('totalInventoryValue')}</p>
        <p className="mt-2 font-display text-3xl font-bold text-[var(--color-dark-gray)]">
          {formatRWF(parseFloat(report.summary.totalValue))}
        </p>
        <p className="mt-1 text-xs text-[var(--color-mid-gray)]">
          {t('totalInventoryValueDescription')}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <h3 className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{t('highestValueItems')}</h3>
          <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('highestValueItemsDescription')}</p>
          <div className="mt-4 space-y-3">
            {highestValueItems.map((item) => (
              <div key={item.code} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-gray)] pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-dark-gray)]">{item.name}</p>
                  <p className="text-xs text-[var(--color-mid-gray)]">Class {item.className} · {item.quantity} {item.category}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-heading)]">{formatRWF(item.value)}</span>
              </div>
            ))}
            {!highestValueItems.length && <p className="text-sm text-[var(--color-mid-gray)]">{t('noItemsFound')}</p>}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[var(--color-gold-100)] p-5">
          <h3 className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{t('abcAttentionItems')}</h3>
          <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('abcAttentionItemsDescription')}</p>
          <div className="mt-4 space-y-3">
            {attentionItems.map((item) => (
              <div key={item.code} className="flex items-center justify-between gap-3 border-b border-[var(--color-gold)]/30 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-dark-gray)]">{item.name}</p>
                  <p className="text-xs text-[var(--color-mid-gray)]">{item.quantity} available · minimum {item.minLevel}</p>
                </div>
                <Badge variant="warning">Class A</Badge>
              </div>
            ))}
            {!attentionItems.length && <p className="text-sm text-[var(--color-mid-gray)]">{t('noAbcAttentionItems')}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
        <div className="mb-4">
          <h3 className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">{t('itemDetails')}</h3>
          <div className="flex flex-wrap gap-2">
            {['A', 'B', 'C'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-semibold border transition-all',
                  selectedClass === cls
                    ? 'bg-[var(--color-medium-green)] text-white border-[var(--color-medium-green)]'
                    : 'bg-[var(--color-white)] text-[var(--color-mid-gray)] border-[var(--color-border-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)]',
                ].join(' ')}
              >
                Class {cls} ({report.classifications[cls].count})
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-[var(--color-soft-gray)] border border-[var(--color-border-gray)] p-4">
          <p className="font-semibold text-[var(--color-dark-gray)]">{currentClass.label}</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">{currentClass.description}</p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm font-semibold text-[var(--color-dark-gray)]">
            <span>{filteredItems.length} {t('items')}</span>
            <span>{formatRWF(parseFloat(currentClass.totalValue))}</span>
            <span>{currentClass.percentage}% of Total Value</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                <th className="text-left py-2 pr-4">{t('code')}</th>
                <th className="text-left py-2 pr-4">{t('itemName')}</th>
                <th className="text-left py-2 pr-4">{t('quantity')}</th>
                <th className="text-left py-2 pr-4">{t('valueRwf')}</th>
                <th className="text-left py-2 pr-4">{t('location')}</th>
                <th className="text-left py-2">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-gray)]">
              {filteredItems.map((row) => (
                <tr key={row._id || row.code} className="hover:bg-[var(--color-soft-gray)]">
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{row.code}</td>
                  <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                  <td className="py-2.5 pr-4">{row.quantity}</td>
                  <td className="py-2.5 pr-4">{formatRWF(row.value)}</td>
                  <td className="py-2.5 pr-4 text-[var(--color-mid-gray)]">{row.location || '—'}</td>
                  <td className="py-2.5">
                    {row.quantity > row.minLevel
                      ? <Badge variant="success">{t('itemsInStock')}</Badge>
                      : row.quantity > 0
                        ? <Badge variant="warning">{t('lowStock')}</Badge>
                        : <Badge variant="error">{t('outOfStock')}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-mid-gray)]">{t('noItemsFound')}</p>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
        <h3 className="font-display font-semibold text-[var(--color-dark-gray)] mb-4">
          Key Insights &amp; Recommendations
        </h3>
        <div className="space-y-4">
          {[
            {
              icon: Target, bg: '#ecfdf5', color: '#10b981',
              title: 'Class A — High-Value Items',
              text: 'Tight inventory control required. Implement periodic cycle counts, maintain detailed records, and ensure rapid reorder response.',
            },
            {
              icon: Scale, bg: '#fffbeb', color: '#f59e0b',
              title: 'Class B — Medium-Value Items',
              text: 'Apply standard inventory practices. Monitor regularly and maintain normal reorder points.',
            },
            {
              icon: BarChart3, bg: '#fef2f2', color: '#ef4444',
              title: 'Class C — Low-Value Items',
              text: 'Simpler controls are acceptable. Use higher reorder points, larger lot sizes, and less frequent reviews.',
            },
          ].map(({ icon: Icon, bg, color, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-dark-gray)]">{title}</p>
                <p className="text-sm text-[var(--color-mid-gray)] mt-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
