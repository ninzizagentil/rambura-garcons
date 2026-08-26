import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, Eye, FileBarChart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import {
  getItems, getTransactions, getLowStockItems, getOutOfStockItems, getDamagedItems,
  getRemovedItems, getUsageByItem, getTotalStockValue,
} from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';

const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-status-blue)'];

function formatRWF(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString('en-US')}`;
}

export default function StockReports() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');

  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const outOfStock = useMemo(() => getOutOfStockItems(), []);
  const damaged = useMemo(() => getDamagedItems(), []);
  const removed = useMemo(() => getRemovedItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);
  const totalValue = useMemo(() => getTotalStockValue(), []);
  const expiring = useMemo(() => items.filter((i) => !!i.expiryDate), [items]);

  const filteredItems = category ? items.filter((i) => i.category === category) : items;
  const filteredTx = category ? transactions.filter((t) => t.category === category) : transactions;

  const received = filteredTx.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0);
  const issued = filteredTx.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.quantity;
    return acc;
  }, {});
  const categoryBalanceData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const mostUsed = usage.filter((i) => (!category || i.category === category) && i.used > 0).slice(0, 5);

  // Movement summary: totals per transaction type, per category.
  const movementSummary = STOCK_CATEGORIES.map((cat) => {
    const rows = transactions.filter((t) => t.category === cat);
    return {
      category: cat,
      in: rows.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
      out: rows.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
      adjustment: rows.filter((t) => t.type === 'adjustment').length,
      transfer: rows.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.quantity, 0),
      removed: rows.filter((t) => t.type === 'removed').reduce((s, t) => s + t.quantity, 0),
    };
  });

  const REPORTS = [
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Every catalogued item with quantity, minimum level, and status.',
      data: filteredItems,
      columns: [
        { key: 'code', header: 'Item Code' },
        { key: 'name', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'unit', header: 'Unit' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'minLevel', header: 'Minimum Level' },
        { key: 'location', header: 'Location' },
        { key: 'status', header: 'Status' },
      ],
      viewTo: '/stock/items',
    },
    {
      id: 'movement',
      title: 'Stock Movement Report',
      description: 'Received, issued, adjusted, transferred, and removed totals by category.',
      data: movementSummary,
      columns: [
        { key: 'category', header: 'Category' },
        { key: 'in', header: 'Stock In' },
        { key: 'out', header: 'Stock Out' },
        { key: 'adjustment', header: 'Adjustments' },
        { key: 'transfer', header: 'Transferred' },
        { key: 'removed', header: 'Removed' },
      ],
      viewTo: '/stock/transactions',
    },
    {
      id: 'low-stock',
      title: 'Low Stock Report',
      description: 'Items at or below their minimum stock level.',
      data: lowStock,
      columns: [
        { key: 'name', header: 'Item' },
        { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Current Quantity' },
        { key: 'minLevel', header: 'Minimum Level' },
        { header: 'Difference', value: (i) => i.quantity - i.minLevel },
      ],
      viewTo: '/stock/low-stock',
    },
    {
      id: 'out-of-stock',
      title: 'Out of Stock Report',
      description: 'Items with zero quantity currently on hand.',
      data: outOfStock,
      columns: [
        { key: 'name', header: 'Item' },
        { key: 'category', header: 'Category' },
        { key: 'minLevel', header: 'Minimum Level' },
        { key: 'supplier', header: 'Supplier' },
        { key: 'location', header: 'Location' },
      ],
      viewTo: '/stock/out-of-stock',
    },
    {
      id: 'damaged',
      title: 'Damaged Stock Report',
      description: 'Reported damage incidents pending or resolved.',
      data: damaged,
      columns: [
        { key: 'itemName', header: 'Item' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'reason', header: 'Reason' },
        { key: 'date', header: 'Date' },
        { key: 'reportedBy', header: 'Reported By' },
        { key: 'status', header: 'Status' },
      ],
      viewTo: '/stock/damaged',
    },
    {
      id: 'expired',
      title: 'Expired Stock Report',
      description: 'Perishable items by batch, expiry date, and status.',
      data: expiring,
      columns: [
        { key: 'name', header: 'Item' },
        { key: 'batchNumber', header: 'Batch / Lot' },
        { key: 'expiryDate', header: 'Expiry Date' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'expiryDaysRemaining', header: 'Days Remaining' },
        { key: 'expiryStatus', header: 'Status' },
      ],
      viewTo: '/stock/expired',
    },
    {
      id: 'removed',
      title: 'Removed / Disposed Report',
      description: 'Permanent record of stock written off or disposed.',
      data: removed,
      columns: [
        { key: 'itemName', header: 'Item' },
        { key: 'quantityRemoved', header: 'Quantity Removed' },
        { key: 'remainingQuantity', header: 'Remaining Quantity' },
        { key: 'reason', header: 'Reason' },
        { key: 'date', header: 'Date' },
        { key: 'responsibleUser', header: 'Responsible User' },
        { key: 'approvedBy', header: 'Approved By' },
      ],
      viewTo: '/stock/removed',
    },
    {
      id: 'valuation',
      title: 'Stock Valuation Report',
      description: 'Current quantity, unit price, and total value per item.',
      data: filteredItems,
      columns: [
        { key: 'name', header: 'Item' },
        { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Quantity' },
        { header: 'Unit Price (RWF)', value: (i) => i.unitPrice || 0 },
        { header: 'Total Value (RWF)', value: (i) => Math.round(i.value || 0) },
      ],
      viewTo: '/stock/items',
    },
    {
      id: 'transactions',
      title: 'Transaction Report',
      description: 'Full chronological log of every stock-changing action.',
      data: filteredTx,
      columns: [
        { key: 'date', header: 'Date' },
        { key: 'itemName', header: 'Item' },
        { key: 'type', header: 'Type' },
        { key: 'quantity', header: 'Quantity' },
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
      <PageHeader
        title="Stock Reports"
        description="Every inventory and movement report, ready to view, print, or export."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Reports' }]}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="All Categories" value={category} onChange={setCategory} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Received Stock</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-green)] mt-1">+{received}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Issued / Used Stock</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-amber)] mt-1">−{issued}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Total Stock Value</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{formatRWF(totalValue)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Current Balances by Category" description="Foods vs. Electronic Devices">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryBalanceData} dataKey="value" nameKey="name" outerRadius={85} label>
                {categoryBalanceData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Used Items" description="Top items by total quantity issued">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mostUsed}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="name" stroke="var(--color-mid-gray)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="used" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <h2 className="font-display text-base font-semibold text-[var(--color-heading)] mb-3">All Reports</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => (
          <div key={report.id} className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] flex-shrink-0">
                <FileBarChart className="w-4.5 h-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display font-semibold text-[var(--color-dark-gray)]">{report.title}</p>
                <p className="text-xs text-[var(--color-mid-gray)] mt-0.5">{report.data.length} record{report.data.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-mid-gray)] mb-4 flex-1">{report.description}</p>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" icon={Eye} onClick={() => navigate(report.viewTo)}>View</Button>
              <IconButton icon={Printer} label={`Print ${report.title}`} onClick={() => handlePrint(report)} />
              <IconButton icon={Download} label={`Export ${report.title} as CSV`} onClick={() => handleExport(report)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
