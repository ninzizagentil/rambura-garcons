import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';

const HEADER_LABEL_KEYS = {
  Stock: 'stockManagement', 'Stock MIS': 'stockMis', 'Stock In': 'stockIn', 'Stock Out': 'stockOut',
  'Stock Transfer': 'stockTransfer', 'Stock Adjustment': 'stockAdjustment', 'All Items': 'allItems',
  'Low Stock': 'lowStock', 'Out of Stock': 'outOfStock', 'Damaged Items': 'damagedItems',
  'Expired Items': 'expiredItems', 'Removed / Disposed': 'removedDisposed', Transactions: 'transactions',
  Suppliers: 'suppliers', 'Usage Analytics': 'usageAnalytics', 'Stock Reports': 'stockReports',
  'Stock Items': 'stockItems', 'Stock Item': 'stockItem', 'Library': 'library', Books: 'books',
  'Borrowed Books': 'borrowedBooks', 'Overdue Books': 'overdueBooks', Returns: 'returns',
  'Borrowing History': 'borrowingHistory', Reports: 'reports', Admin: 'admin', Website: 'website',
};

export function Breadcrumb({ items }) {
  const { t } = useApp();
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-2 text-sm text-[var(--color-mid-gray)]">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
            {item.to && i < items.length - 1 ? (
              <Button as={Link} to={item.to} variant="secondary" size="sm" className="min-w-fit">
                {t(HEADER_LABEL_KEYS[item.label] || item.label)}
              </Button>
            ) : (
              <Button variant="primary" size="sm" className="min-w-fit pointer-events-none">
                {t(HEADER_LABEL_KEYS[item.label] || item.label)}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function PageHeader({ title, description, breadcrumb, actions }) {
  const { t } = useApp();
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean)[0];
  const fallbackBreadcrumb = section
    ? [{ label: section.charAt(0).toUpperCase() + section.slice(1), to: `/${section}` }, { label: title }]
    : [{ label: title }];

  return (
    <div className="flex flex-col gap-3 mb-6">
      <Breadcrumb items={breadcrumb || fallbackBreadcrumb} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-heading)]">{t(HEADER_LABEL_KEYS[title] || title)}</h1>
          {description && <p className="text-sm text-[var(--color-mid-gray)] mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
