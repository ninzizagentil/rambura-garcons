/**
 * StockReports — Consolidated reporting hub.
 *
 * Tabs:
 *   overview    — KPI summary + charts + 9 downloadable report cards
 *   analytics   — Fast/slow-moving items, monthly trend, category value
 *   abc         — ABC classification analysis (previously orphaned)
 */
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
} from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useApp } from '../../context/AppContext';

// ── constants ──────────────────────────────────────────────────────────────
const PIE_COLORS   = ['var(--color-medium-green)', 'var(--color-status-blue)', 'var(--color-gold)'];
const ABC_COLORS   = ['#10b981', '#f59e0b', '#ef4444'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TABS = [
  { id: 'overview',  label: 'Overview'           },
  { id: 'analytics', label: 'Usage Analytics'    },
  { id: 'abc',       label: 'ABC Classification' },
];

// ── helpers ────────────────────────────────────────────────────────────────
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

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('rg_access_token')}` };
}

// ── main component ─────────────────────────────────────────────────────────
export default function StockReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.find((tb) => tb.id === searchParams.get('tab'))?.id ?? 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useApp();

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('stockReports')}
        description="Inventory reports, usage analytics and ABC classification in one place."
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('reports') }]}
      />

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border-gray)] pb-0">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
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
              {label}
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Overview
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ t }) {
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const [category, setCategory] = useState('');

  const items        = useMemo(() => getItems(),           []);
  const transactions = useMemo(() => getTransactions(),    []);
  const lowStock     = useMemo(() => getLowStockItems(),   []);
  const outOfStock   = useMemo(() => getOutOfStockItems(), []);
  const damaged      = useMemo(() => getDamagedItems(),    []);
  const removed      = useMemo(() => getRemovedItems(),    []);
  const usage        = useMemo(() => getUsageByItem(),     []);
  const totalValue   = useMemo(() => getTotalStockValue(), []);
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
      id: 'inventory', title: 'Inventory Report',
      description: 'Every catalogued item with quantity, minimum level, and status.',
      data: filteredItems,
      columns: [
        { key: 'code', header: 'Item Code' }, { key: 'name', header: 'Item Name' },
        { key: 'category', header: 'Category' }, { key: 'unit', header: 'Unit' },
        { key: 'quantity', header: 'Quantity' }, { key: 'minLevel', header: 'Minimum Level' },
        { key: 'location', header: 'Location' }, { key: 'status', header: 'Status' },
      ],
      viewTo: '/stock/items',
    },
    {
      id: 'movement', title: 'Stock Movement Report',
      description: 'Received, issued, adjusted, transferred, and removed totals by category.',
      data: movementSummary,
      columns: [
        { key: 'category', header: 'Category' }, { key: 'in', header: 'Stock In' },
        { key: 'out', header: 'Stock Out' }, { key: 'adjustment', header: 'Adjustments' },
        { key: 'transfer', header: 'Transferred' }, { key: 'removed', header: 'Removed' },
      ],
      viewTo: '/stock/transactions',
    },
    {
      id: 'low-stock', title: 'Low Stock Report',
      description: 'Items at or below their minimum stock level.',
      data: lowStock,
      columns: [
        { key: 'name', header: 'Item' }, { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Current Quantity' }, { key: 'minLevel', header: 'Minimum Level' },
        { header: 'Difference', value: (i) => i.quantity - i.minLevel },
      ],
      viewTo: '/stock/alerts?tab=low-stock',
    },
    {
      id: 'out-of-stock', title: 'Out of Stock Report',
      description: 'Items with zero quantity currently on hand.',
      data: outOfStock,
      columns: [
        { key: 'name', header: 'Item' }, { key: 'category', header: 'Category' },
        { key: 'minLevel', header: 'Minimum Level' }, { key: 'supplier', header: 'Supplier' },
        { key: 'location', header: 'Location' },
      ],
      viewTo: '/stock/alerts?tab=out-of-stock',
    },
    {
      id: 'damaged', title: 'Damaged Stock Report',
      description: 'Reported damage incidents pending or resolved.',
      data: damaged,
      columns: [
        { key: 'itemName', header: 'Item' }, { key: 'quantity', header: 'Quantity' },
        { key: 'reason', header: 'Reason' }, { key: 'date', header: 'Date' },
        { key: 'reportedBy', header: 'Reported By' }, { key: 'status', header: 'Status' },
      ],
      viewTo: '/stock/activity?tab=damaged',
    },
    {
      id: 'expired', title: 'Expired Stock Report',
      description: 'Perishable items by batch, expiry date, and status.',
      data: expiring,
      columns: [
        { key: 'name', header: 'Item' }, { key: 'batchNumber', header: 'Batch / Lot' },
        { key: 'expiryDate', header: 'Expiry Date' }, { key: 'quantity', header: 'Quantity' },
        { key: 'expiryDaysRemaining', header: 'Days Remaining' },
        { key: 'expiryStatus', header: 'Status' },
      ],
      viewTo: '/stock/alerts?tab=expiring',
    },
    {
      id: 'removed', title: 'Removed / Disposed Report',
      description: 'Permanent record of stock written off or disposed.',
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
      id: 'valuation', title: 'Stock Valuation Report',
      description: 'Current quantity, unit price, and total value per item.',
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
      id: 'transactions', title: 'Transaction Report',
      description: 'Full chronological log of every stock-changing action.',
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
    showToast(`${report.title} downloaded as CSV.`, 'success');
  };
  const handlePrint = (report) => {
    const ok = printReport(report.title, report.columns, report.data);
    if (!ok) showToast('Enable pop-ups to print this report.', 'error');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown
          label={t('allCategories')}
          value={category}
          onChange={setCategory}
          options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>

      {/* KPI strip */}
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

      {/* Charts */}
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

      {/* Report cards */}
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
                View
              </Button>
              <IconButton icon={Printer} label={`Print ${report.title}`} onClick={() => handlePrint(report)} />
              <IconButton icon={Download} label={`Export ${report.title} as CSV`} onClick={() => handleExport(report)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Usage Analytics
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsTab({ t }) {
  const [category, setCategory]     = useState('');
  const usage           = useMemo(() => getUsageByItem(),          []);
  const transactions    = useMemo(() => getTransactions(),         []);
  const valueByCategory = useMemo(() => getStockValueByCategory(), []);

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
          options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ABC Classification (previously orphaned — now accessible)
// ─────────────────────────────────────────────────────────────────────────────
function ABCTab() {
  const { showToast }     = useToast();
  const [report, setReport]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [selectedClass, setSelectedClass] = useState('A');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/stock/reports/abc-classification', { headers: authHeader() });
        const json = await res.json();
        if (!cancelled) {
          if (json.success) setReport(json.data);
          else showToast('Failed to load ABC report', 'error');
        }
      } catch (err) {
        if (!cancelled) showToast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToast]);

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

  const chartData = [
    { name: 'Class A', count: report.classifications.A.count, value: parseFloat(report.classifications.A.totalValue) },
    { name: 'Class B', count: report.classifications.B.count, value: parseFloat(report.classifications.B.totalValue) },
    { name: 'Class C', count: report.classifications.C.count, value: parseFloat(report.classifications.C.totalValue) },
  ];
  const currentClass = report.classifications[selectedClass];

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-mid-gray)]">
        ABC analysis classifies inventory items by value so you can focus control effort where it matters most.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: report.summary.totalItems, color: 'var(--color-dark-gray)',   bg: 'var(--color-off-white)' },
          { label: 'Class A',     value: report.classifications.A.count, sub: `${report.classifications.A.percentage}% of value`, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Class B',     value: report.classifications.B.count, sub: `${report.classifications.B.percentage}% of value`, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Class C',     value: report.classifications.C.count, sub: `${report.classifications.C.percentage}% of value`, color: '#ef4444', bg: '#fef2f2' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5"
            style={{ background: bg }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</p>
            <p className="font-display text-3xl font-bold mt-2" style={{ color }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Items by Classification">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Value Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData} cx="50%" cy="50%" outerRadius={90}
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatRWF(value)}`}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={ABC_COLORS[i % ABC_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatRWF(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Class detail table */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
        <div className="mb-4">
          <h3 className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Classification Details</h3>
          <div className="flex flex-wrap gap-2">
            {['A', 'B', 'C'].map((cls) => (
              <button
                key={cls}
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

        {/* Class description strip */}
        <div className="mb-4 rounded-xl bg-[var(--color-soft-gray)] border border-[var(--color-border-gray)] p-4">
          <p className="font-semibold text-[var(--color-dark-gray)]">{currentClass.label}</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">{currentClass.description}</p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm font-semibold text-[var(--color-dark-gray)]">
            <span>{currentClass.count} Items</span>
            <span>{formatRWF(parseFloat(currentClass.totalValue))}</span>
            <span>{currentClass.percentage}% of Total Value</span>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                <th className="text-left py-2 pr-4">Code</th>
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Qty</th>
                <th className="text-left py-2 pr-4">Stock Value</th>
                <th className="text-left py-2 pr-4">Location</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-gray)]">
              {currentClass.items.map((row) => (
                <tr key={row._id || row.code} className="hover:bg-[var(--color-soft-gray)]">
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{row.code}</td>
                  <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                  <td className="py-2.5 pr-4">{row.quantity}</td>
                  <td className="py-2.5 pr-4">{formatRWF(row.value)}</td>
                  <td className="py-2.5 pr-4 text-[var(--color-mid-gray)]">{row.location || '—'}</td>
                  <td className="py-2.5">
                    {row.quantity > row.minLevel
                      ? <Badge variant="success">In Stock</Badge>
                      : row.quantity > 0
                        ? <Badge variant="warning">Low Stock</Badge>
                        : <Badge variant="error">Out of Stock</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
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
