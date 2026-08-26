import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { PackagePlus, PackageMinus, Pencil, ArrowLeft, ClipboardEdit, ArrowLeftRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { StatusBadge, Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getItemById, getTransactionsForItem } from '../../services/stockService';
import StockItemFormModal from './StockItemFormModal';

export default function StockItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const [searchParams, setSearchParams] = useSearchParams();
  const [item, setItem] = useState(() => getItemById(id));
  const [transactions, setTransactions] = useState(() => getTransactionsForItem(id));
  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === '1');

  useEffect(() => {
    setItem(getItemById(id));
    setTransactions(getTransactionsForItem(id));
  }, [id]);

  const refresh = () => {
    setItem(getItemById(id));
    setTransactions(getTransactionsForItem(id));
  };

  if (!item) return <Navigate to="/stock/items" replace />;

  const stockInHistory = transactions.filter((t) => t.type === 'in');
  const stockOutHistory = transactions.filter((t) => t.type === 'out');
  const adjustmentHistory = transactions.filter((t) => t.type === 'adjustment');
  const transferHistory = transactions.filter((t) => t.type === 'transfer');

  return (
    <div>
      <PageHeader
        title={item.name}
        description={item.category}
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'All Items', to: '/stock/items' }, { label: item.name }]}
        actions={
          !viewOnly && (
            <>
              <Button variant="secondary" icon={Pencil} onClick={() => { setSearchParams({}); setEditOpen(true); }}>Edit Item</Button>
              <Button variant="outline" icon={ArrowLeftRight} onClick={() => navigate(`/stock/transfer?item=${item.id}`)}>Transfer</Button>
              <Button variant="outline" icon={ClipboardEdit} onClick={() => navigate(`/stock/adjustment?item=${item.id}`)}>Adjust</Button>
              <Button variant="outline" icon={PackageMinus} onClick={() => navigate(`/stock/stock-out?item=${item.id}`)}>Stock Out</Button>
              <Button icon={PackagePlus} onClick={() => navigate(`/stock/stock-in?item=${item.id}`)}>Stock In</Button>
            </>
          )
        }
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={item.status} />
            <span className="text-xs text-[var(--color-mid-gray)]">Unit: {item.unit}</span>
          </div>
          <p className="text-sm text-[var(--color-dark-gray)] leading-relaxed">{item.description || 'No description provided.'}</p>
          <dl className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--color-border-gray)]">
            <div><dt className="text-xs text-[var(--color-mid-gray)]">Category</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{item.category}</dd></div>
            <div><dt className="text-xs text-[var(--color-mid-gray)]">Current Quantity</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{item.quantity} {item.unit}</dd></div>
            <div><dt className="text-xs text-[var(--color-mid-gray)]">Minimum Quantity</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{item.minLevel} {item.unit}</dd></div>
          </dl>
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Recent Activity</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">No stock movements recorded yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {transactions.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-dark-gray)]">{t.date}</span>
                  <Badge tone={t.type === 'in' ? 'green' : 'amber'}>{t.type === 'in' ? '+' : '−'}{t.quantity} {item.unit}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Stock In History</p>
          {stockInHistory.length === 0 ? (
            <EmptyState title="No Stock In records" message="This item hasn't received any stock yet." />
          ) : (
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Quantity</th>
                    <th className="text-left py-2">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-gray)]">
                  {stockInHistory.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4">{t.date}</td>
                      <td className="py-2.5 pr-4 font-medium text-[var(--color-status-green)]">+{t.quantity}</td>
                      <td className="py-2.5">{t.party}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Stock Out History</p>
          {stockOutHistory.length === 0 ? (
            <EmptyState title="No Stock Out records" message="This item hasn't been issued yet." />
          ) : (
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Quantity</th>
                    <th className="text-left py-2">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-gray)]">
                  {stockOutHistory.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4">{t.date}</td>
                      <td className="py-2.5 pr-4 font-medium text-[var(--color-status-amber)]">−{t.quantity}</td>
                      <td className="py-2.5">{t.party}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Adjustment History</p>
          {adjustmentHistory.length === 0 ? (
            <EmptyState title="No adjustments recorded" message="This item's quantity hasn't been reconciled against a physical count yet." />
          ) : (
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Difference</th>
                    <th className="text-left py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-gray)]">
                  {adjustmentHistory.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4">{t.date}</td>
                      <td className={`py-2.5 pr-4 font-medium ${t.difference > 0 ? 'text-[var(--color-status-green)]' : 'text-[var(--color-status-red)]'}`}>{t.difference > 0 ? '+' : ''}{t.difference}</td>
                      <td className="py-2.5">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">Transfer History</p>
          {transferHistory.length === 0 ? (
            <EmptyState title="No transfers recorded" message="This item hasn't moved between locations yet." />
          ) : (
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Quantity</th>
                    <th className="text-left py-2">Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-gray)]">
                  {transferHistory.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4">{t.date}</td>
                      <td className="py-2.5 pr-4 font-medium text-[var(--color-status-blue)]">{t.quantity}</td>
                      <td className="py-2.5">{t.fromLocation} → {t.toLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/stock/items')} className="mt-5">
        Back to All Items
      </Button>

      <StockItemFormModal open={editOpen && !viewOnly} onClose={() => setEditOpen(false)} item={item} onSaved={() => { refresh(); setEditOpen(false); }} />
    </div>
  );
}
