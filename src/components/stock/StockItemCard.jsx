import { Pencil, Eye, Trash2, TrendingDown, AlertTriangle, Package } from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import IconButton from '../common/IconButton';

/**
 * Professional Stock Item Card
 * Displays inventory item with visual indicators and actions
 */
export function StockItemCard({
  item,
  onView,
  onEdit,
  onDelete,
  onClick,
}) {
  const stockPercentage = (item.quantity / Math.max(item.minLevel, 1)) * 100;
  const statusColor = {
    'out-of-stock': 'from-red-50 to-red-25',
    'low-stock': 'from-amber-50 to-amber-25',
    normal: 'from-green-50 to-green-25',
  };

  return (
    <div
      className="stock-item-card group"
      onClick={onClick}
    >
      {/* Header with category badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Package className="w-5 h-5" />
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Item info */}
      <div className="mb-4 min-h-[56px]">
        <h3 className="font-semibold text-[var(--color-dark-gray)] text-sm leading-snug mb-1 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-xs text-[var(--color-mid-gray)]">
          Code: <span className="font-mono text-blue-600">{item.code}</span>
        </p>
      </div>

      {/* Stock level indicator */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-[var(--color-mid-gray)]">Stock Level</span>
          <span className="text-xs font-semibold text-[var(--color-dark-gray)]">
            {item.quantity} {item.unit}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              stockPercentage >= 100 ? 'bg-green-500' :
              stockPercentage >= 50 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-mid-gray)] mt-1">
          Min: {item.minLevel} {item.unit}
        </p>
      </div>

      {/* Value & category */}
      <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs text-[var(--color-mid-gray)] mb-0.5">Value</p>
          <p className="text-sm font-semibold text-[var(--color-dark-gray)]">
            RWF {Math.round(item.value || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-mid-gray)] mb-0.5">Category</p>
          <p className="text-sm font-semibold text-[var(--color-dark-gray)]">
            {item.category === 'Foods' ? 'Foods' : 'Electronics'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <IconButton
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
          }}
          title="View details"
          size="sm"
          variant="outline"
        />
        {!onEdit.disabled && (
          <IconButton
            icon={Pencil}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            title="Edit item"
            size="sm"
            variant="outline"
          />
        )}
        {!onDelete.disabled && (
          <IconButton
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            title="Delete item"
            size="sm"
            variant="outline"
            isDanger
          />
        )}
      </div>
    </div>
  );
}

/**
 * Stock item card grid layout
 */
export function StockItemGrid({ items, onView, onEdit, onDelete, onItemClick }) {
  if (items.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Package className="w-12 h-12 text-[var(--color-border-gray)] mx-auto mb-3" />
        <p className="text-[var(--color-mid-gray)]">No stock items found</p>
      </div>
    );
  }

  return items.map(item => (
    <StockItemCard
      key={item.id}
      item={item}
      onView={() => onView(item)}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(item)}
      onClick={() => onItemClick?.(item)}
    />
  ));
}
